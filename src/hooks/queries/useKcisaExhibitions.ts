import { useQuery } from '@tanstack/react-query';

import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	todayExhibitionDateString,
	type ExhibitionStatus,
} from '@/src/utils/exhibitionSearch';
import { supabase } from '@/src/utils/supabase';

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
const PROVISIONAL_TITLE_MARKER = '(가제)';
const BOOSTED_VENUE_KEYWORDS = ['국립현대미술관'];
const KCISA_LIST_STALE_MS = 5 * 60 * 1000;

export const kcisaExhibitionsQueryKey = () => ['exhibitions', 'kcisa'] as const;

const rankVenue = (venue: string, type: string | null) => {
	if (type?.trim() === '상설전') return 2;
	if (BOOSTED_VENUE_KEYWORDS.some((k) => venue.includes(k))) return 0;
	return 1;
};

const fetchKcisaExhibitions = async (): Promise<KcisaExhibitionItem[]> => {
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

	if (error) throw error;

	return (data ?? [])
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
				rank: rankVenue(venue, row.type),
			};
		})
		.sort((a, b) => a.rank - b.rank)
		.slice(0, LIST_LIMIT)
		.map(({ rank: _rank, ...item }) => item);
};

export function useKcisaExhibitions() {
	return useQuery({
		queryKey: kcisaExhibitionsQueryKey(),
		queryFn: fetchKcisaExhibitions,
		staleTime: KCISA_LIST_STALE_MS,
		retry: 1,
	});
}
