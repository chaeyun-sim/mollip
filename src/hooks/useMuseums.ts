import { useEffect, useState } from 'react';
import type { VenueGroup } from '@/src/data/venues';
import { supabase } from '@/src/utils/supabase';
import { formatMuseumClosedDays, formatMuseumOpenHours } from '@/src/utils/formatMuseumHours';

interface MuseumRow {
	id: number;
	name: string;
	name_en: string | null;
	address: string | null;
	address_en: string | null;
	phone: string | null;
	homepage_url: string | null;
	gps_x: string;
	gps_y: string;
	open_hours: string | null;
	rstdeInfo: string | null;
	// 운영 DB에 없을 수 있는 컬럼 — 스키마 드리프트에 대비해 optional
	description?: string | null;
	amenities: string | null;
	parking: string | null;
	venue_group_name?: string | null;
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
		venueNameEn: row.name_en?.trim() || undefined,
		venueAddress: row.address || undefined,
		venueAddressEn: row.address_en?.trim() || undefined,
		coordinates: { latitude, longitude },
		openHours: formatMuseumOpenHours(row.open_hours, row.rstdeInfo),
		closedDays: formatMuseumClosedDays(row.rstdeInfo, null),
		exhibitions: [],
		phone: row.phone || undefined,
		homepageUrl: row.homepage_url || undefined,
		amenities: row.amenities
			? row.amenities
					.split('+')
					.map((a) => a.trim())
					.filter(Boolean)
			: undefined,
		parking: row.parking || undefined,
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
			parking: first.parking,
			subVenues: members,
		});
	}

	return [...ungrouped, ...parents];
}

// Supabase museums(전국박물관미술관정보표준데이터 + 수동 보강) → 지도 마커 VenueGroup
export function useMuseums(): VenueGroup[] {
	const [museumVenues, setMuseumVenues] = useState<VenueGroup[]>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			// 컬럼을 명시하면 운영 DB에 없는 컬럼(description, venue_group_name 등) 하나 때문에
			// 쿼리 전체가 42703으로 실패해 지도 핀이 전부 사라진다 — '*'로 받아 없는 필드는 undefined로 둔다.
			const { data, error } = await supabase.from('museums').select('*');

			if (cancelled) return;

			if (error || !data) {
				console.warn('[museums] 조회 실패:', error?.message);
				return;
			}

			const rows = data as unknown as MuseumRow[];
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
