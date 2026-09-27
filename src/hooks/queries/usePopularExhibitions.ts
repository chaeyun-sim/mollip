import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ExhibitionSummary } from '@/src/hooks/queries/useExploreScreenData';
import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	todayExhibitionDateString,
} from '@/src/utils/exhibitionSearch';
import {
	buildPopularExhibitions,
	POPULAR_RANKING_LIMIT,
	POPULAR_SECTION_SIZE,
	type PopularEntry,
} from '@/src/utils/popularExhibitions';
import { supabase } from '@/src/utils/supabase';

const POPULAR_STALE_MS = 5 * 60 * 1000;

export function popularExhibitionsQueryKey() {
	return ['exhibitions', 'popular'] as const;
}

interface PopularQueryData {
	entries: PopularEntry[];
	displayById: Map<string, ExhibitionSummary>;
}

async function fetchPopularExhibitions(): Promise<PopularQueryData> {
	const { data, error } = await supabase.rpc('get_popular_exhibitions', {
		p_limit: POPULAR_RANKING_LIMIT,
	});

	if (error) throw error;

	const entries: PopularEntry[] = (data ?? []).map((row) => ({
		exhibitionId: String(row.exhibition_id),
		score: Number(row.score),
	}));
	const numericIds = entries
		.map((entry) => Number(entry.exhibitionId))
		.filter((value) => Number.isFinite(value));

	if (numericIds.length === 0) {
		return { entries, displayById: new Map() };
	}

	const { data: rows, error: rowsError } = await applyExhibitionDateFilters(
		supabase
			.from('exhibitions')
			.select('id, title, venue_name_fallback, event_site, image_url, start_date, end_date')
			.in('id', numericIds)
			.gte('end_date', todayExhibitionDateString()),
	);

	if (rowsError) throw rowsError;

	const displayById = new Map<string, ExhibitionSummary>(
		(rows ?? []).map((row) => [
			String(row.id),
			{
				id: String(row.id),
				title: row.title,
				venue: [row.venue_name_fallback, row.event_site].filter(Boolean).join(' '),
				thumbnail: row.image_url,
				status: getExhibitionStatus({
					startDate: row.start_date ?? '',
					endDate: row.end_date ?? '',
				}),
			},
		]),
	);

	return { entries, displayById };
}

/**
 * 북마크 수 + 조회수 기반 인기 전시 목록.
 * 집계는 RPC가 담당하고, 표시 정보는 exhibitions에서 조인한다.
 * excludeIds는 캐시 키가 아니다 — 피처드와 겹치는 카드만 클라이언트에서 뺀다.
 */
export function usePopularExhibitions(excludeIds: string[] = []) {
	const query = useQuery({
		queryKey: popularExhibitionsQueryKey(),
		queryFn: fetchPopularExhibitions,
		staleTime: POPULAR_STALE_MS,
		retry: 1,
	});

	const excludeKey = excludeIds.join(',');
	const data = useMemo(
		() =>
			buildPopularExhibitions({
				entries: query.data?.entries ?? [],
				displayById: query.data?.displayById ?? new Map(),
				limit: POPULAR_SECTION_SIZE,
				excludeIds: excludeKey.length > 0 ? excludeKey.split(',') : [],
			}),
		[query.data, excludeKey],
	);

	return {
		data,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
}
