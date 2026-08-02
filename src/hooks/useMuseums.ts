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

// Supabase museums(전국박물관미술관정보표준데이터 + 수동 보강) → 지도 마커 VenueGroup
export function useMuseums(): VenueGroup[] {
	const [museumVenues, setMuseumVenues] = useState<VenueGroup[]>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data } = await supabase
				.from('museums')
				.select(
					'id, name, address, phone, homepage_url, gps_x, gps_y, open_hours, rstdeInfo, description, amenities',
				);
			if (cancelled || !data) return;
			const mapped = (data as MuseumRow[])
				.map(rowToVenueGroup)
				.filter((v): v is VenueGroup => v !== null);
			setMuseumVenues(mapped);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return museumVenues;
}
