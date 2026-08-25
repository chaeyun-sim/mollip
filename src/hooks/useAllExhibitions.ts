import { useCallback, useEffect, useRef, useState } from 'react';

import type { RecommendableItem } from '@/src/components/explore/ExploreHomeSections';
import { getExhibitionStatus, todayExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { supabase } from '@/src/utils/supabase';

const PAGE_SIZE = 20;

export interface UseAllExhibitionsResult {
	items: RecommendableItem[];
	status: 'idle' | 'loading' | 'error' | 'success';
	isLoadingMore: boolean;
	hasMore: boolean;
	loadMore: () => void;
	refetch: () => void;
}

export function useAllExhibitions(): UseAllExhibitionsResult {
	const [items, setItems] = useState<RecommendableItem[]>([]);
	const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const pageRef = useRef(0);
	const loadingRef = useRef(false);

	const fetchPage = useCallback(async (pageIndex: number, reset: boolean) => {
		if (loadingRef.current) return;
		loadingRef.current = true;

		if (reset) {
			setStatus('loading');
		} else {
			setIsLoadingMore(true);
		}

		const { data, error } = await supabase
			.from('exhibitions')
			.select('id, title, venue_name_fallback, image_url, start_date, end_date')
			.gte('end_date', todayExhibitionDateString())
			// synced_at은 같은 배치로 동기화된 행이 전부 동일해 동률이 흔함 — id로 2차 정렬해 페이지 경계를 고정
			.order('synced_at', { ascending: false })
			.order('id', { ascending: false })
			.range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1);

		loadingRef.current = false;

		if (error) {
			if (reset) setStatus('error');
			setIsLoadingMore(false);
			return;
		}

		const newItems: RecommendableItem[] = (data ?? []).map((row) => ({
			id: String(row.id),
			title: (row.title ?? '').trim(),
			venue: (row.venue_name_fallback ?? '').trim(),
			thumbnail: row.image_url ?? null,
			status: getExhibitionStatus({
				startDate: row.start_date ?? '',
				endDate: row.end_date ?? '',
			}),
		}));

		setItems((prev) => (reset ? newItems : [...prev, ...newItems]));
		setHasMore(newItems.length === PAGE_SIZE);
		if (reset) setStatus('success');
		setIsLoadingMore(false);
	}, []);

	useEffect(() => {
		fetchPage(0, true);
	}, [fetchPage]);

	const loadMore = useCallback(() => {
		if (loadingRef.current || !hasMore) return;
		const nextPage = pageRef.current + 1;
		pageRef.current = nextPage;
		fetchPage(nextPage, false);
	}, [hasMore, fetchPage]);

	const refetch = useCallback(() => {
		pageRef.current = 0;
		setHasMore(true);
		fetchPage(0, true);
	}, [fetchPage]);

	return { items, status, isLoadingMore, hasMore, loadMore, refetch };
}
