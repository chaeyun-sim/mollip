import { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase';
import type { DayVisit } from '@/src/store/visitStore';

/**
 * Lightweight hook: fetches only image_url for each visit's exhibitionId.
 * Returns a map of dateKey → poster image URL.
 */
export function useExhibitionPosterUrls(visits: Record<string, DayVisit>): Record<string, string> {
	const [posterMap, setPosterMap] = useState<Record<string, string>>({});

	useEffect(() => {
		const entries = Object.entries(visits).filter(
			([, v]) => v.exhibitionId && Number.isFinite(Number(v.exhibitionId)),
		);
		if (entries.length === 0) return;

		let cancelled = false;
		Promise.all(
			entries.map(([dateKey, v]) =>
				supabase
					.from('exhibitions')
					.select('image_url')
					.eq('id', Number(v.exhibitionId))
					.maybeSingle()
					.then(({ data }) => ({
						dateKey,
						imageUrl: (data as { image_url?: string | null } | null)?.image_url?.trim() || null,
					})),
			),
		).then((results) => {
			if (cancelled) return;
			const map: Record<string, string> = {};
			for (const { dateKey, imageUrl } of results) {
				if (imageUrl) map[dateKey] = imageUrl;
			}
			setPosterMap(map);
		});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		JSON.stringify(Object.fromEntries(Object.entries(visits).map(([k, v]) => [k, v.exhibitionId]))),
	]);

	return posterMap;
}
