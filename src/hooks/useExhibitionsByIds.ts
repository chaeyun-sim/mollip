import { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';

export interface ExhibitionStub {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
}

/** 만료 여부에 관계없이 지정한 ID 목록의 전시 데이터를 조회 */
export function useExhibitionsByIds(ids: string[]) {
	const [items, setItems] = useState<ExhibitionStub[]>([]);

	useEffect(() => {
		if (ids.length === 0) return;

		supabase
			.from('exhibitions')
			.select('id, title, venue_name_fallback, event_site, image_url')
			.in('id', ids.map(Number))
			.then(({ data, error }) => {
				if (error || !data) return;
				setItems(
					data.map((row) => ({
						id: String(row.id),
						title: row.title,
						venue: [row.venue_name_fallback, row.event_site].filter(Boolean).join(' '),
						thumbnail: row.image_url,
					})),
				);
			});
		// ids 배열 내용이 바뀔 때만 재조회
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ids.join(',')]);

	return items;
}
