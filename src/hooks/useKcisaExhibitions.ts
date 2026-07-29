import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';

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
		const { data, error } = await supabase
			.from('kcisa_exhibitions')
			.select('id, title, institution, event_site, image_url')
			.order('collected_date', { ascending: false })
			.limit(LIST_LIMIT);

		if (error) {
			setStatus('error');
			return;
		}

		setItems(
			data.map((row) => ({
				id: row.id,
				title: row.title,
				venue: [row.institution, row.event_site].filter(Boolean).join(' '),
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
