import { useEffect, useMemo, useState } from 'react';
import type { VenueGroup } from '@/src/data/venues';
import type { Exhibition } from '@/src/data/exhibitions';
import { useMuseums } from '@/src/hooks/useMuseums';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
} from '@/src/utils/exhibitionMapper';
import { supabase } from '@/src/utils/supabase';
import { parseDate } from '@/src/utils/mapUtils';
import {
	applyExhibitionDateFilters,
	isValidExhibitionDateString,
} from '@/src/utils/exhibitionSearch';

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
	const end = parseDate(row.end_date ?? '');
	end.setHours(23, 59, 59, 999);
	return d >= start && d <= end;
}

type ExhibitionMaps = {
	/** 마커 필터("전시 진행 중")·declutter 우선순위용 — filterDate 기준 진행 중인 전시만 */
	active: Map<number, Exhibition[]>;
	/** VenueSheet 표시용 — 진행 중 + 예정(아직 끝나지 않은) 전시 전부 */
	all: Map<number, Exhibition[]>;
};

// museums 마커에 museum_id로 연결된 전시를 붙여 지도 필터(전시 진행 중)와 declutter 우선순위가 동작하게 한다.
export function useMapVenues(filterDate: Date): VenueGroup[] {
	const museumVenues = useMuseums();
	const [maps, setMaps] = useState<ExhibitionMaps>({ active: new Map(), all: new Map() });

	useEffect(() => {
		let cancelled = false;
		const key = dateKey(filterDate);
		(async () => {
			// end_date >= filterDate: 진행 중 + 예정 모두 가져온다 (start_date 제한 없음)
			const { data, error } = await applyExhibitionDateFilters(
				supabase
					.from('exhibitions')
					.select(EXHIBITION_COLUMNS)
					.not('museum_id', 'is', null)
					.gte('end_date', key)
					.order('start_date', { ascending: false })
					.limit(2000),
			);
			if (cancelled || error || !data) return;

			const active = new Map<number, Exhibition[]>();
			const all = new Map<number, Exhibition[]>();
			for (const row of data as ExhibitionRow[]) {
				if (!row.museum_id) continue;
				const ex = mapExhibitionRowToExhibition(row);

				// all: 아직 끝나지 않은 전시 전부 (진행 중 + 예정)
				const allList = all.get(row.museum_id) ?? [];
				allList.push(ex);
				all.set(row.museum_id, allList);

				// active: filterDate 기준 진행 중인 것만 (마커 필터·declutter 전용)
				if (isActiveOn(row, filterDate)) {
					const activeList = active.get(row.museum_id) ?? [];
					activeList.push(ex);
					active.set(row.museum_id, activeList);
				}
			}
			setMaps({ active, all });
		})();
		return () => {
			cancelled = true;
		};
	}, [filterDate]);

	return useMemo(
		() =>
			museumVenues.map((v) => {
				if (v.subVenues && v.subVenues.length > 0) {
					// 부모 VenueGroup(예: 예술의전당):
					//  - subVenue.exhibitions → all (VenueSheet에서 진행 중/예정 탭 모두 표시)
					//  - parent.exhibitions   → active only (hasExhibitionOn 마커 필터용)
					const updatedSubVenues = v.subVenues.map((sv) => ({
						...sv,
						exhibitions: sv.museumId != null ? (maps.all.get(sv.museumId) ?? []) : sv.exhibitions,
					}));
					return {
						...v,
						exhibitions: updatedSubVenues.flatMap((sv) =>
							sv.museumId != null ? (maps.active.get(sv.museumId) ?? []) : [],
						),
						subVenues: updatedSubVenues,
					};
				}
				return {
					...v,
					exhibitions: v.museumId != null ? (maps.active.get(v.museumId) ?? []) : v.exhibitions,
				};
			}),
		[museumVenues, maps],
	);
}
