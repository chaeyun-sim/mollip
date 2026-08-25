import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	todayExhibitionDateString,
	type ExhibitionStatus,
} from '@/src/utils/exhibitionSearch';

export interface KcisaExhibitionItem {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const LIST_LIMIT = 10;

let _cachedItems: KcisaExhibitionItem[] | null = null;

export function useKcisaExhibitions() {
	const [items, setItems] = useState<KcisaExhibitionItem[]>(_cachedItems ?? []);
	const [status, setStatus] = useState<Status>(_cachedItems ? 'success' : 'idle');

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
				.select('id, title, venue_name_fallback, event_site, image_url, start_date, end_date')
				.eq('source', 'kcisa')
				.gte('end_date', todayExhibitionDateString())
				.order('collected_date', { ascending: false })
				.limit(LIST_LIMIT),
		);

		if (error) {
			setStatus('error');
			return;
		}

		const mapped = data.map((row) => ({
			id: String(row.id),
			title: row.title,
			venue: [row.venue_name_fallback, row.event_site].filter(Boolean).join(' '),
			thumbnail: row.image_url,
			status: getExhibitionStatus({
				startDate: row.start_date ?? '',
				endDate: row.end_date ?? '',
			}),
		}));
		_cachedItems = mapped;
		setItems(mapped);
		setStatus('success');
	}, []);

	useEffect(() => {
		fetchExhibitions();
	}, [fetchExhibitions]);

	return { items, status, refetch: fetchExhibitions };
}
