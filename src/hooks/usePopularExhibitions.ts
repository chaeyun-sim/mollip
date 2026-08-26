import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ExhibitionSummary } from '@/src/hooks/useExploreScreenData';
import { supabase } from '@/src/utils/supabase';
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

type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * 북마크 수 + 조회수 기반 인기 전시 목록.
 * 집계는 security definer RPC(`get_popular_exhibitions`)가 담당하고,
 * 표시 정보(제목·기관·썸네일·기간)는 exhibitions 테이블에서 조인한다.
 */
export function usePopularExhibitions(excludeIds: string[] = []) {
	const [entries, setEntries] = useState<PopularEntry[]>([]);
	const [displayById, setDisplayById] = useState<Map<string, ExhibitionSummary>>(new Map());
	const [status, setStatus] = useState<Status>('loading');

	const excludeKey = excludeIds.join(',');

	const loadPopular = useCallback(async () => {
		const { data, error } = await supabase.rpc('get_popular_exhibitions', {
			p_limit: POPULAR_RANKING_LIMIT,
		});

		if (error || !data) {
			setStatus('error');
			return;
		}

		const rankedEntries: PopularEntry[] = data.map((row) => ({
			exhibitionId: String(row.exhibition_id),
			score: Number(row.score),
		}));
		const numericIds = rankedEntries
			.map((entry) => Number(entry.exhibitionId))
			.filter((value) => Number.isFinite(value));

		if (numericIds.length === 0) {
			setEntries(rankedEntries);
			setDisplayById(new Map());
			setStatus('success');
			return;
		}

		const { data: rows, error: rowsError } = await applyExhibitionDateFilters(
			supabase
				.from('exhibitions')
				.select('id, title, venue_name_fallback, event_site, image_url, start_date, end_date')
				.in('id', numericIds)
				.gte('end_date', todayExhibitionDateString()),
		);

		if (rowsError || !rows) {
			setStatus('error');
			return;
		}

		const nextDisplay = new Map<string, ExhibitionSummary>(
			rows.map((row) => [
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

		setEntries(rankedEntries);
		setDisplayById(nextDisplay);
		setStatus('success');
	}, []);

	const refetch = useCallback(() => {
		setStatus('loading');
		void loadPopular();
	}, [loadPopular]);

	useEffect(() => {
		void loadPopular();
	}, [loadPopular]);

	const items = useMemo(
		() =>
			buildPopularExhibitions({
				entries,
				displayById,
				limit: POPULAR_SECTION_SIZE,
				excludeIds: excludeKey.length > 0 ? excludeKey.split(',') : [],
			}),
		[entries, displayById, excludeKey],
	);

	return { items, status, refetch };
}
