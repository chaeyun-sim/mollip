import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useVisitStore } from '@/src/store/visitStore';
import { getExhibitionStatus, todayExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { supabase } from '@/src/utils/supabase';

const MAX_RECOMMENDED = 5;
const FETCH_LIMIT = 100;
const FRESHNESS_DAYS = 7;
const RECOMMENDED_STALE_MS = 5 * 60 * 1000;

interface ExhibitionRow {
	id: string | number;
	title: string;
	venue_name_fallback: string;
	image_url: string | null;
	genre: string | null;
	tags: string[] | null;
	synced_at: string | null;
	start_date: string;
	end_date: string;
}

export function recommendedExhibitionsQueryKey(preferredGenres: string[]) {
	return ['exhibitions', 'recommended', [...preferredGenres].sort()] as const;
}

function scoreExhibition(
	row: ExhibitionRow,
	preferredGenres: string[],
	visitedSet: Set<string>,
	bookmarkedSet: Set<string>,
): number {
	let score = 0;
	if (row.genre && preferredGenres.includes(row.genre)) score += 40;
	if (Array.isArray(row.tags) && row.tags.some((t) => preferredGenres.includes(t))) score += 20;
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
			'id, title, venue_name_fallback, image_url, genre, tags, synced_at, start_date, end_date',
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

async function fetchRecommendedRows(preferredGenres: string[]): Promise<ExhibitionRow[]> {
	const filtered = await fetchExhibitionRows(preferredGenres);
	if (preferredGenres.length > 0 && filtered.length === 0) {
		return fetchExhibitionRows([]);
	}
	return filtered;
}

function toRecommendableItem(row: ExhibitionRow): RecommendableItem {
	return {
		id: String(row.id),
		title: row.title.trim(),
		venue: row.venue_name_fallback.trim(),
		thumbnail: row.image_url,
		status: getExhibitionStatus({ startDate: row.start_date, endDate: row.end_date }),
		startDate: row.start_date ?? null,
		endDate: row.end_date ?? null,
	};
}

export function useRecommendedExhibitions(preferredGenres: string[], isPersonalized: boolean) {
	const visits = useVisitStore((s) => s.visits);
	const bookmarkedIds = useBookmarkStore((s) => s.ids);

	const query = useQuery({
		queryKey: recommendedExhibitionsQueryKey(preferredGenres),
		queryFn: () => fetchRecommendedRows(preferredGenres),
		staleTime: RECOMMENDED_STALE_MS,
		retry: 1,
	});

	const data = useMemo((): RecommendableItem[] => {
		const rows = query.data ?? [];
		if (rows.length === 0) return [];
		if (!isPersonalized) {
			return rows.slice(0, MAX_RECOMMENDED).map(toRecommendableItem);
		}

		const visitedIds = Object.values(visits)
			.map((visit) => visit.exhibitionId)
			.filter((id): id is string => id !== null);
		const visitedSet = new Set(visitedIds);
		const bookmarkedSet = new Set(bookmarkedIds);
		return [...rows]
			.map((row) => ({
				row,
				score: scoreExhibition(row, preferredGenres, visitedSet, bookmarkedSet),
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_RECOMMENDED)
			.map(({ row }) => toRecommendableItem(row));
	}, [query.data, preferredGenres, visits, bookmarkedIds, isPersonalized]);

	return { data };
}
