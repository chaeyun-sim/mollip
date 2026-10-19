import { distanceKm } from '@/src/utils/mapUtils';

export const NEARBY_ALERT_RADIUS_METERS = 800;
export const NEARBY_ALERT_MAX_REGIONS = 20;
export const NEARBY_ALERT_MAX_DISTANCE_KM = 20;
export const NEARBY_ALERT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
export const NEARBY_ALERT_DAILY_LIMIT_MS = 24 * 60 * 60 * 1000;
export const NEARBY_ALERT_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const NEARBY_ALERT_RECENT_USE_MS = 60 * 60 * 1000;

export interface NearbyExhibitionCandidate {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	museumId: number;
	venueName: string;
}

export interface NearbyExhibitionVenue {
	museumId: number;
	venueName: string;
	latitude: number;
	longitude: number;
	exhibitions: NearbyExhibitionCandidate[];
}

export interface NearbyAlertRegion {
	identifier: string;
	latitude: number;
	longitude: number;
	venueName: string;
	museumId: number;
	exhibitions: NearbyExhibitionCandidate[];
}

export interface NearbyAlertDelivery {
	exhibitionId: string;
	sentAt: number;
}

export interface NearbyAlertDecisionInput {
	exhibitionId: string;
	now: number;
	deliveries: NearbyAlertDelivery[];
	lastForegroundAt: number | null;
}

export const isExhibitionActive = (startDate: string, endDate: string, now: Date): boolean => {
	const parse = (value: string) => {
		const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(value);
		return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
	};
	const start = parse(startDate);
	const end = parse(endDate);
	if (!start || !end) return false;
	end.setHours(23, 59, 59, 999);
	return now >= start && now <= end;
};

export const selectNearbyAlertRegions = (
	venues: NearbyExhibitionVenue[],
	origin: { latitude: number; longitude: number },
	maxRegions = NEARBY_ALERT_MAX_REGIONS,
	maxDistanceKm = NEARBY_ALERT_MAX_DISTANCE_KM,
): NearbyAlertRegion[] => {
	const candidates = venues
		.filter(
			(venue) =>
				Number.isFinite(venue.latitude) &&
				Number.isFinite(venue.longitude) &&
				venue.latitude >= -90 &&
				venue.latitude <= 90 &&
				venue.longitude >= -180 &&
				venue.longitude <= 180 &&
				venue.exhibitions.length > 0,
		)
		.map((venue) => ({
			venue,
			distance: distanceKm(origin.latitude, origin.longitude, venue.latitude, venue.longitude),
		}))
		.filter((candidate) => candidate.distance <= maxDistanceKm)
		.sort((a, b) => a.distance - b.distance || a.venue.museumId - b.venue.museumId);

	const groups: { anchor: NearbyExhibitionVenue; exhibitions: NearbyExhibitionCandidate[] }[] = [];
	for (const { venue } of candidates) {
		const nearbyGroup = groups.find(
			(group) =>
				distanceKm(
					group.anchor.latitude,
					group.anchor.longitude,
					venue.latitude,
					venue.longitude,
				) <=
				NEARBY_ALERT_RADIUS_METERS / 1000,
		);
		if (nearbyGroup) {
			nearbyGroup.exhibitions.push(...venue.exhibitions);
		} else {
			groups.push({ anchor: venue, exhibitions: [...venue.exhibitions] });
		}
	}

	return groups.slice(0, maxRegions).map(({ anchor, exhibitions }) => ({
		identifier: `nearby-exhibition-${anchor.museumId}`,
		latitude: anchor.latitude,
		longitude: anchor.longitude,
		venueName: anchor.venueName,
		museumId: anchor.museumId,
		exhibitions: exhibitions.sort(
			(a, b) =>
				Number(b.museumId === anchor.museumId) - Number(a.museumId === anchor.museumId) ||
				a.endDate.localeCompare(b.endDate) ||
				a.title.localeCompare(b.title, 'ko'),
		),
	}));
};

export const canSendNearbyExhibitionAlert = ({
	exhibitionId,
	now,
	deliveries,
	lastForegroundAt,
}: NearbyAlertDecisionInput): boolean => {
	if (lastForegroundAt != null && now - lastForegroundAt < NEARBY_ALERT_RECENT_USE_MS) return false;
	const recent = deliveries.filter((delivery) => now - delivery.sentAt < NEARBY_ALERT_WEEK_MS);
	if (recent.some((delivery) => now - delivery.sentAt < NEARBY_ALERT_DAILY_LIMIT_MS)) return false;
	if (recent.length >= 2) return false;
	return !deliveries.some(
		(delivery) =>
			delivery.exhibitionId === exhibitionId && now - delivery.sentAt < NEARBY_ALERT_COOLDOWN_MS,
	);
};
