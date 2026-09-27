import { useQuery } from '@tanstack/react-query';

import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	isValidExhibitionDateString,
	todayExhibitionDateString,
	type ExhibitionStatus,
} from '@/src/utils/exhibitionSearch';
import { stripHtml } from '@/src/utils/stripHtml';
import { supabase } from '@/src/utils/supabase';
import { syncCultureExhibitionsIfStale } from '@/src/utils/syncCultureExhibitions';

export interface CultureExhibitionItem {
	id: string;
	title: string;
	venue: string;
	startDate: string;
	endDate: string;
	thumbnail: string;
	status: ExhibitionStatus;
}

const CULTURE_LIST_STALE_MS = 5 * 60 * 1000;

export const cultureExhibitionsQueryKey = () => ['exhibitions', 'culture'] as const;

interface ExhibitionCultureRow {
	id: number;
	title: string;
	start_date: string;
	end_date: string;
	venue_name_fallback: string;
	image_url: string | null;
}

const fetchCultureExhibitions = async (): Promise<CultureExhibitionItem[]> => {
	let syncError: unknown = null;
	try {
		await syncCultureExhibitionsIfStale();
	} catch (err) {
		// 캐시에 이미 데이터가 있으면 공공API 실패는 무시하고 캐시로 계속 서비스한다.
		// 캐시도 비어있는 채로 동기화까지 실패하면 아래에서 에러를 다시 던진다.
		syncError = err;
	}

	const { data, error } = await applyExhibitionDateFilters(
		supabase
			.from('exhibitions')
			.select('id, title, start_date, end_date, venue_name_fallback, image_url')
			.eq('source', 'culture')
			.gte('end_date', todayExhibitionDateString()),
	);
	if (error) throw error;
	if (syncError && (data ?? []).length === 0) throw syncError;

	return ((data ?? []) as ExhibitionCultureRow[])
		.filter(
			(item): item is ExhibitionCultureRow & { start_date: string; end_date: string } =>
				isValidExhibitionDateString(item.start_date) && isValidExhibitionDateString(item.end_date),
		)
		.map((item) => ({
			id: String(item.id),
			title: stripHtml(item.title),
			venue: item.venue_name_fallback,
			startDate: item.start_date,
			endDate: item.end_date,
			thumbnail: item.image_url ?? '',
			status: getExhibitionStatus({ startDate: item.start_date, endDate: item.end_date }),
		}));
};

export function useCultureExhibitions() {
	return useQuery({
		queryKey: cultureExhibitionsQueryKey(),
		queryFn: fetchCultureExhibitions,
		staleTime: CULTURE_LIST_STALE_MS,
		retry: 1,
	});
}
