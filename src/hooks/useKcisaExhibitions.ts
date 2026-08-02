import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import { applyExhibitionDateFilters, todayExhibitionDateString } from '@/src/utils/exhibitionSearch';

export interface KcisaExhibitionItem {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const LIST_LIMIT = 10;

export function useKcisaExhibitions() {
	const [items, setItems] = useState<KcisaExhibitionItem[]>([]);
	const [status, setStatus] = useState<Status>('idle');

	const fetchExhibitions = useCallback(async () => {
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

		setItems(
			data.map((row) => ({
				id: String(row.id),
				title: row.title,
				venue: [row.venue_name_fallback, row.event_site].filter(Boolean).join(' '),
				thumbnail: row.image_url,
			})),
		);
		setStatus('success');
	}, []);

	useEffect(() => {
		fetchExhibitions();
	}, [fetchExhibitions]);

	return { items, status, refetch: fetchExhibitions };
}
