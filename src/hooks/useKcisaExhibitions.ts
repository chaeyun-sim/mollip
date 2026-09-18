import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	todayExhibitionDateString,
	type ExhibitionStatus,
} from '@/src/utils/exhibitionSearch';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';

export interface KcisaExhibitionItem {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
}

const LIST_LIMIT = 10;
// (가제) 필터링 후에도 LIST_LIMIT을 채울 수 있게 여유 있게 가져온다
const FETCH_BUFFER = 30;
// 제목이 확정되지 않은 예정 전시 — 국립 기관 전시 목록에서 제외
const PROVISIONAL_TITLE_MARKER = '(가제)';
// 항상 화제성 있는 관 — 있으면 목록 앞쪽으로 우선 노출
const BOOSTED_VENUE_KEYWORDS = ['국립현대미술관'];
// 상설전은 완전히 빼면 노출 가능한 전시 풀이 너무 줄어들어 뒤쪽으로 미루기만 한다

let _cachedItems: KcisaExhibitionItem[] | null = null;

export function useKcisaExhibitions() {
	const [items, setItems] = useState<KcisaExhibitionItem[]>(_cachedItems ?? []);
	const [status, setStatus] = useState<AsyncStatus>(_cachedItems ? 'success' : 'idle');

	const fetchExhibitions = useCallback(async () => {
		if (_cachedItems) {
			setItems(_cachedItems);
			setStatus('success');
			return;
		}
		setStatus('loading');
		const { data, error } = await applyExhibitionDateFilters(
			supabase
				.from('exhibitions')
				.select('id, title, venue_name_fallback, event_site, image_url, start_date, end_date, type')
				.in('source', ['kcisa', 'kcisa_moca'])
				.gte('end_date', todayExhibitionDateString())
				.not('title', 'ilike', `%${PROVISIONAL_TITLE_MARKER}%`)
				.order('collected_date', { ascending: false })
				.limit(FETCH_BUFFER),
		);

		if (error) {
			setStatus('error');
			return;
		}

		const rank = (venue: string, type: string | null) => {
			if (type?.trim() === '상설전') return 2;
			if (BOOSTED_VENUE_KEYWORDS.some((k) => venue.includes(k))) return 0;
			return 1;
		};

		const mapped = data
			.map((row) => {
				const venue = [row.venue_name_fallback, row.event_site].filter(Boolean).join(' ');
				return {
					id: String(row.id),
					title: row.title,
					venue,
					thumbnail: row.image_url,
					status: getExhibitionStatus({
						startDate: row.start_date ?? '',
						endDate: row.end_date ?? '',
					}),
					rank: rank(venue, row.type),
				};
			})
			.sort((a, b) => a.rank - b.rank)
			.slice(0, LIST_LIMIT)
			.map(({ rank: _rank, ...item }) => item);
		_cachedItems = mapped;
		setItems(mapped);
		setStatus('success');
	}, []);

	useEffect(() => {
		fetchExhibitions();
	}, [fetchExhibitions]);

	return { items, status, refetch: fetchExhibitions };
}
