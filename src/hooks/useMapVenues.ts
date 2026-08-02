import { useEffect, useMemo, useState } from 'react';
import type { VenueGroup } from '@/src/data/venues';
import type { Exhibition } from '@/src/data/exhibitions';
import { useMuseums } from '@/src/hooks/useMuseums';
import { EXHIBITION_COLUMNS, mapExhibitionRowToExhibition, type ExhibitionRow } from '@/src/utils/exhibitionMapper';
import { supabase } from '@/src/utils/supabase';
import { parseDate } from '@/src/utils/mapUtils';
import { applyExhibitionDateFilters, isValidExhibitionDateString } from '@/src/utils/exhibitionSearch';

function dateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}.${m}.${day}`;
}

function isActiveOn(row: ExhibitionRow, filterDate: Date): boolean {
	if (!isValidExhibitionDateString(row.start_date) || !isValidExhibitionDateString(row.end_date)) {
		return false;
	}
	const d = new Date(filterDate);
	d.setHours(0, 0, 0, 0);
	const start = parseDate(row.start_date);
	const end = parseDate(row.end_date);
	end.setHours(23, 59, 59, 999);
	return d >= start && d <= end;
}

// museums 마커에 museum_id로 연결된 전시를 붙여 지도 필터(전시 진행 중)와 declutter 우선순위가 동작하게 한다.
export function useMapVenues(filterDate: Date): VenueGroup[] {
	const museumVenues = useMuseums();
	const [byMuseumId, setByMuseumId] = useState<Map<number, Exhibition[]>>(new Map());

	useEffect(() => {
		let cancelled = false;
		const key = dateKey(filterDate);
		(async () => {
			const { data, error } = await applyExhibitionDateFilters(
				supabase
					.from('exhibitions')
					.select(EXHIBITION_COLUMNS)
					.not('museum_id', 'is', null)
					.lte('start_date', key)
					.gte('end_date', key)
					.order('start_date', { ascending: false })
					.limit(8000),
			);
			if (cancelled || error || !data) return;

			const map = new Map<number, Exhibition[]>();
			for (const row of data as ExhibitionRow[]) {
				if (!row.museum_id || !isActiveOn(row, filterDate)) continue;
				const ex = mapExhibitionRowToExhibition(row);
				const list = map.get(row.museum_id) ?? [];
				list.push(ex);
				map.set(row.museum_id, list);
			}
			setByMuseumId(map);
		})();
		return () => {
			cancelled = true;
		};
	}, [filterDate]);

	return useMemo(
		() =>
			museumVenues.map((v) => ({
				...v,
				exhibitions: v.museumId != null ? (byMuseumId.get(v.museumId) ?? []) : v.exhibitions,
			})),
		[museumVenues, byMuseumId],
	);
}
