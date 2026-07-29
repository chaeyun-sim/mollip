import { EXHIBITIONS, type Exhibition } from './exhibitions';

export type VenueGroup = {
	venueName: string;
	venueAddress?: string;
	coordinates: { latitude: number; longitude: number };
	openHours: string;
	closedDays?: string;
	exhibitions: Exhibition[];
	phone?: string;
	homepageUrl?: string;
};

export const venueGroups: VenueGroup[] = (() => {
	const map = new Map<string, VenueGroup>();
	for (const ex of EXHIBITIONS) {
		if (!ex.coordinates) continue;
		if (!map.has(ex.venue)) {
			map.set(ex.venue, {
				venueName: ex.venue,
				venueAddress: ex.venueAddress,
				coordinates: ex.coordinates,
				openHours: ex.openHours,
				closedDays: ex.closedDays,
				exhibitions: [],
			});
		}
		map.get(ex.venue)!.exhibitions.push(ex);
	}
	return Array.from(map.values());
})();

export const venueNames = new Set(venueGroups.map((v) => v.venueName));
