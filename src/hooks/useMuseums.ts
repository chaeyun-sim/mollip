import { useEffect, useState } from 'react';
import type { VenueGroup } from '@/src/data/venues';
import { supabase } from '@/src/utils/supabase';
import { formatMuseumClosedDays, formatMuseumOpenHours } from '@/src/utils/formatMuseumHours';

interface MuseumRow {
	id: number;
	name: string;
	address: string | null;
	phone: string | null;
	homepage_url: string | null;
	gps_x: string;
	gps_y: string;
	open_hours: string | null;
	rstdeInfo: string | null;
	description: string | null;
	amenities: string | null;
	venue_group_name: string | null;
}

function rowToVenueGroup(row: MuseumRow): VenueGroup | null {
	const latitude = Number(row.gps_y);
	const longitude = Number(row.gps_x);
	if (!row.name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return null;
	}
	return {
		museumId: row.id,
		venueName: row.name,
		venueAddress: row.address || undefined,
		coordinates: { latitude, longitude },
		openHours: formatMuseumOpenHours(row.open_hours, row.rstdeInfo),
		closedDays: formatMuseumClosedDays(row.rstdeInfo, null),
		exhibitions: [],
		phone: row.phone || undefined,
		homepageUrl: row.homepage_url || undefined,
		description: row.description || undefined,
		amenities: row.amenities
			? row.amenities.split('+').map((a) => a.trim()).filter(Boolean)
			: undefined,
	};
}

/** venue_group_name이 같은 행을 하나의 부모 VenueGroup으로 묶는다. */
function groupByVenueGroupName(
	rows: MuseumRow[],
	venues: (VenueGroup & { _groupName?: string })[],
): VenueGroup[] {
	const grouped = new Map<string, VenueGroup[]>();
	const ungrouped: VenueGroup[] = [];

	for (let i = 0; i < rows.length; i++) {
		const venue = venues[i];
		if (!venue) continue;
		const groupName = rows[i].venue_group_name;
		if (groupName) {
			const list = grouped.get(groupName) ?? [];
			list.push(venue);
			grouped.set(groupName, list);
		} else {
			ungrouped.push(venue);
		}
	}

	const parents: VenueGroup[] = [];
	for (const [groupName, members] of grouped) {
		const first = members[0];
		parents.push({
			venueName: groupName,
			venueAddress: first.venueAddress,
			coordinates: first.coordinates,
			openHours: first.openHours,
			closedDays: first.closedDays,
			exhibitions: [],
			phone: first.phone,
			homepageUrl: first.homepageUrl,
			description: first.description,
			amenities: first.amenities,
			subVenues: members,
		});
	}

	return [...ungrouped, ...parents];
}

const BASE_COLUMNS = 'id, name, address, phone, homepage_url, gps_x, gps_y, open_hours, rstdeInfo, description, amenities';

// Supabase museums(전국박물관미술관정보표준데이터 + 수동 보강) → 지도 마커 VenueGroup
export function useMuseums(): VenueGroup[] {
	const [museumVenues, setMuseumVenues] = useState<VenueGroup[]>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			// venue_group_name 컬럼을 포함해 조회 — 마이그레이션이 아직 적용 안 됐으면
			// error가 반환되므로 fallback으로 컬럼 없이 재조회해 핀이 사라지는 걸 방지한다.
			const { data, error } = await supabase
				.from('museums')
				.select(`${BASE_COLUMNS}, venue_group_name`);

			if (cancelled) return;

			if (error || !data) {
				// venue_group_name 컬럼이 없는 경우(마이그레이션 미적용) — 그룹핑 없이 개별 핀으로 표시
				const { data: fallback } = await supabase.from('museums').select(BASE_COLUMNS);
				if (cancelled || !fallback) return;
				const mapped = (fallback as MuseumRow[])
					.map(rowToVenueGroup)
					.filter((v): v is VenueGroup => v !== null);
				setMuseumVenues(mapped);
				return;
			}

			const rows = data as MuseumRow[];
			const mapped = rows.map(rowToVenueGroup);
			const validPairs = rows
				.map((row, i) => ({ row, venue: mapped[i] }))
				.filter((p): p is { row: MuseumRow; venue: VenueGroup } => p.venue !== null);
			const grouped = groupByVenueGroupName(
				validPairs.map((p) => p.row),
				validPairs.map((p) => p.venue),
			);
			setMuseumVenues(grouped);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return museumVenues;
}
