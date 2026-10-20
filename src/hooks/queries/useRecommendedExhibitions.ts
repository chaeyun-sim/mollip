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
import { supabase } from '@/src/utils/supabase';

const MAX_RECOMMENDED = 100;
const FETCH_LIMIT = 100;
const FRESHNESS_DAYS = 7;
const RECOMMENDED_STALE_MS = 5 * 60 * 1000;

interface ExhibitionRow {
	id: string | number;
	title: string;
	description: string | null;
	venue_name_fallback: string;
	image_url: string | null;
	genre: string | null;
	tags: string[] | null;
	synced_at: string | null;
	start_date: string;
	end_date: string;
}

export function recommendedExhibitionsQueryKey(
	preferredGenres: string[],
	preferredArtists: string[],
	preferredTaste: PreferredTasteDetails,
) {
	return [
		'exhibitions',
		'recommended',
		[...preferredGenres].sort(),
		[...preferredArtists].sort((left, right) => left.localeCompare(right)),
		[...preferredTaste.moods].sort(),
		[...preferredTaste.venueScales].sort(),
		[...preferredTaste.artMovements].sort(),
	] as const;
}

function scoreExhibition(
	row: ExhibitionRow,
	preferredGenres: string[],
	preferredArtists: string[],
	preferredTaste: PreferredTasteDetails,
	visitedSet: Set<string>,
	bookmarkedSet: Set<string>,
): number {
	let score = 0;
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

async function fetchExhibitionRows(preferredGenres: string[]): Promise<ExhibitionRow[]> {
	let query = supabase
		.from('exhibitions')
		.select(
			'id, title, description, venue_name_fallback, image_url, genre, tags, synced_at, start_date, end_date',
		)
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
		venue: row.venue_name_fallback.trim(),
		thumbnail: row.image_url,
		status: getExhibitionStatus({ startDate: row.start_date, endDate: row.end_date }),
		startDate: row.start_date ?? null,
		endDate: row.end_date ?? null,
		recommendationTags: [
			...new Set([...(matchedGenre ? [matchedGenre] : []), ...matchedTastes, ...matchedArtists]),
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

	const query = useQuery({
		queryKey: recommendedExhibitionsQueryKey(preferredGenres, preferredArtists, preferredTaste),
		queryFn: () => fetchExhibitionRows(hasDetailedTaste ? [] : preferredGenres),
		enabled: isPersonalized,
		staleTime: RECOMMENDED_STALE_MS,
		retry: 1,
	});

	const data = useMemo((): RecommendableItem[] => {
		const rows = query.data ?? [];
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
				),
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_RECOMMENDED)
			.map(({ row }) => toRecommendableItem(row, preferredGenres, preferredArtists, preferredTaste))
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
