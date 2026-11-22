import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useVisitStore } from '@/src/store/visitStore';
import { getExhibitionStatus, todayExhibitionDateString } from '@/src/utils/exhibitionSearch';
import {
	matchPreferredArtist,
	matchPreferredArtists,
	matchPreferredTaste,
	matchPreferredTastes,
	type PreferredTasteDetails,
} from '@/src/utils/preferredTaste';
import {
	buildRevisitAffinity,
	lovedExhibitionIds,
	revisitMatchesFor,
	type RevisitAffinity,
	type RevisitSourceRow,
} from '@/src/utils/revisitAffinity';
import { supabase } from '@/src/utils/supabase';

const MAX_RECOMMENDED = 100;
const FETCH_LIMIT = 100;
const FRESHNESS_DAYS = 7;
const RECOMMENDED_STALE_MS = 5 * 60 * 1000;

interface ExhibitionRow {
	id: string | number;
	museum_id: number | null;
	title: string;
	title_en: string | null;
	description: string | null;
	venue_name_fallback: string;
	image_url: string | null;
	genre: string | null;
	tags: string[] | null;
	synced_at: string | null;
	start_date: string;
	end_date: string;
	museums: { name_en: string | null } | null;
}

const EXHIBITION_ROW_COLUMNS =
	'id, museum_id, title, title_en, description, venue_name_fallback, image_url, genre, tags, synced_at, start_date, end_date, museums(name_en)';

const EMPTY_AFFINITY: RevisitAffinity = { museumIds: new Set(), genres: new Set() };

interface RecommendationSource {
	rows: ExhibitionRow[];
	affinity: RevisitAffinity;
}

export function recommendedExhibitionsQueryKey(
	preferredGenres: string[],
	preferredArtists: string[],
	preferredTaste: PreferredTasteDetails,
	lovedIds: number[] = [],
) {
	return [
		'exhibitions',
		'recommended',
		[...preferredGenres].sort(),
		[...preferredArtists].sort((left, right) => left.localeCompare(right)),
		[...preferredTaste.moods].sort(),
		[...preferredTaste.venueScales].sort(),
		[...preferredTaste.artMovements].sort(),
		lovedIds,
	] as const;
}

function scoreExhibition(
	row: ExhibitionRow,
	preferredGenres: string[],
	preferredArtists: string[],
	preferredTaste: PreferredTasteDetails,
	visitedSet: Set<string>,
	bookmarkedSet: Set<string>,
	affinity: RevisitAffinity,
): number {
	let score = revisitMatchesFor(row, affinity).score;
	if (row.genre && preferredGenres.includes(row.genre)) score += 40;
	if (matchPreferredArtist(`${row.title} ${row.description ?? ''}`, preferredArtists)) score += 25;
	if (
		matchPreferredTaste(
			`${row.title} ${row.description ?? ''}`,
			row.venue_name_fallback,
			preferredTaste,
		)
	) {
		score += 15;
	}
	if (row.synced_at) {
		const freshCutoff = new Date();
		freshCutoff.setDate(freshCutoff.getDate() - FRESHNESS_DAYS);
		if (new Date(row.synced_at) >= freshCutoff) score += 20;
	}
	const id = String(row.id);
	if (visitedSet.has(id) || bookmarkedSet.has(id)) score -= 10;
	return score;
}

/** "또 갈래요" 전시의 미술관·장르 — 기록이 없으면 요청하지 않는다 */
async function fetchRevisitAffinity(lovedIds: number[]): Promise<RevisitAffinity> {
	if (lovedIds.length === 0) return EMPTY_AFFINITY;
	const { data, error } = await supabase
		.from('exhibitions')
		.select('id, museum_id, genre')
		.in('id', lovedIds);
	if (error) throw error;
	return buildRevisitAffinity((data ?? []) as RevisitSourceRow[]);
}

/** 좋아한 미술관에서 진행 중인 전시 — 장르로 좁힌 후보에서 빠지지 않게 따로 받는다 */
async function fetchMuseumRows(museumIds: number[]): Promise<ExhibitionRow[]> {
	if (museumIds.length === 0) return [];
	const { data, error } = await supabase
		.from('exhibitions')
		.select(EXHIBITION_ROW_COLUMNS)
		.gte('end_date', todayExhibitionDateString())
		.in('museum_id', museumIds)
		.limit(FETCH_LIMIT);
	if (error) throw error;
	return (data ?? []) as ExhibitionRow[];
}

async function fetchRecommendationSource(
	preferredGenres: string[],
	lovedIds: number[],
): Promise<RecommendationSource> {
	const affinity = await fetchRevisitAffinity(lovedIds);
	const [rows, museumRows] = await Promise.all([
		fetchExhibitionRows(preferredGenres),
		fetchMuseumRows([...affinity.museumIds]),
	]);
	const seen = new Set(rows.map((row) => String(row.id)));
	return {
		rows: [...rows, ...museumRows.filter((row) => !seen.has(String(row.id)))],
		affinity,
	};
}

async function fetchExhibitionRows(preferredGenres: string[]): Promise<ExhibitionRow[]> {
	let query = supabase
		.from('exhibitions')
		.select(EXHIBITION_ROW_COLUMNS)
		.gte('end_date', todayExhibitionDateString())
		.order('synced_at', { ascending: false })
		.limit(FETCH_LIMIT);

	if (preferredGenres.length > 0) {
		query = query.in('genre', preferredGenres);
	}

	const { data, error } = await query;
	if (error) throw error;
	return (data ?? []) as ExhibitionRow[];
}

function toRecommendableItem(
	row: ExhibitionRow,
	preferredGenres: string[],
	preferredArtists: string[],
	preferredTaste: PreferredTasteDetails,
	affinity: RevisitAffinity = EMPTY_AFFINITY,
): RecommendableItem {
	const matchedGenre = row.genre && preferredGenres.includes(row.genre) ? row.genre : null;
	const matchedArtists = matchPreferredArtists(
		`${row.title} ${row.description ?? ''}`,
		preferredArtists,
	);
	const matchedTastes = matchPreferredTastes(
		`${row.title} ${row.description ?? ''}`,
		row.venue_name_fallback,
		preferredTaste,
	);
	return {
		id: String(row.id),
		title: row.title.trim(),
		titleEn: row.title_en,
		venue: row.venue_name_fallback.trim(),
		venueEn: row.museums?.name_en ?? null,
		thumbnail: row.image_url,
		status: getExhibitionStatus({ startDate: row.start_date, endDate: row.end_date }),
		startDate: row.start_date ?? null,
		endDate: row.end_date ?? null,
		recommendationTags: [
			...new Set([
				...(matchedGenre ? [matchedGenre] : []),
				...matchedTastes,
				...matchedArtists,
				// "또 갈래요" 전시와 같은 미술관·장르 — recommendations.labels에서 문구로 바뀐다
				...revisitMatchesFor(row, affinity).tags,
			]),
		],
	};
}

export function useRecommendedExhibitions(
	preferredGenres: string[],
	preferredArtists: string[],
	preferredTaste: PreferredTasteDetails,
	isPersonalized: boolean,
) {
	const visits = useVisitStore((s) => s.visits);
	const bookmarkedIds = useBookmarkStore((s) => s.ids);
	// 작가·상세 취향은 장르와 무관하게 일치할 수 있어, 있으면 장르로 조회 범위를 좁히지 않는다.
	const hasDetailedTaste =
		preferredArtists.length > 0 ||
		preferredTaste.moods.length > 0 ||
		preferredTaste.venueScales.length > 0 ||
		preferredTaste.artMovements.length > 0;

	const lovedIds = useMemo(() => lovedExhibitionIds(visits), [visits]);

	const query = useQuery({
		queryKey: recommendedExhibitionsQueryKey(
			preferredGenres,
			preferredArtists,
			preferredTaste,
			lovedIds,
		),
		queryFn: () => fetchRecommendationSource(hasDetailedTaste ? [] : preferredGenres, lovedIds),
		enabled: isPersonalized,
		staleTime: RECOMMENDED_STALE_MS,
		retry: 1,
	});

	const data = useMemo((): RecommendableItem[] => {
		const rows = query.data?.rows ?? [];
		const affinity = query.data?.affinity ?? EMPTY_AFFINITY;
		if (rows.length === 0) return [];
		if (!isPersonalized) {
			return rows
				.slice(0, MAX_RECOMMENDED)
				.map((row) => toRecommendableItem(row, [], preferredArtists, preferredTaste));
		}

		const visitedIds = Object.values(visits)
			.map((visit) => visit.exhibitionId)
			.filter((id): id is string => id !== null);
		const visitedSet = new Set(visitedIds);
		const bookmarkedSet = new Set(bookmarkedIds);
		return [...rows]
			.map((row) => ({
				row,
				score: scoreExhibition(
					row,
					preferredGenres,
					preferredArtists,
					preferredTaste,
					visitedSet,
					bookmarkedSet,
					affinity,
				),
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_RECOMMENDED)
			.map(({ row }) =>
				toRecommendableItem(row, preferredGenres, preferredArtists, preferredTaste, affinity),
			)
			.filter((item) => (item.recommendationTags?.length ?? 0) > 0);
	}, [
		query.data,
		preferredGenres,
		preferredArtists,
		preferredTaste,
		visits,
		bookmarkedIds,
		isPersonalized,
	]);

	return {
		data,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
}
