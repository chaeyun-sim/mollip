import {
	NEARBY_ALERT_BOUNDARY_ID,
	NEARBY_ALERT_BOUNDARY_RADIUS_METERS,
	NEARBY_ALERT_COOLDOWN_MS,
	NEARBY_ALERT_DAILY_LIMIT_MS,
	NEARBY_ALERT_MAX_REGIONS,
	NEARBY_ALERT_MAX_VENUE_REGIONS,
	NEARBY_ALERT_RADIUS_METERS,
	buildNearbyGeofences,
	canSendNearbyExhibitionAlert,
	filterActiveVenues,
	isExhibitionActive,
	selectNearbyAlertRegions,
	type NearbyAlertDelivery,
	type NearbyExhibitionVenue,
} from '@/src/utils/nearbyExhibitionAlertPolicy';

const origin = { latitude: 37.5665, longitude: 126.978 };

const venue = (
	museumId: number,
	offsetMeters: number,
	exhibitionIds: string[],
): NearbyExhibitionVenue => ({
	museumId,
	venueName: `미술관 ${museumId}`,
	latitude: origin.latitude + offsetMeters / 111_000,
	longitude: origin.longitude,
	exhibitions: exhibitionIds.map((id) => ({
		id,
		title: `전시 ${id}`,
		startDate: '2026.10.01',
		endDate: '2026.11.01',
		museumId,
		venueName: `미술관 ${museumId}`,
	})),
});

describe('nearby exhibition alert policy', () => {
	it('groups nearby venues and keeps the closest venue as the region anchor', () => {
		const regions = selectNearbyAlertRegions(
			[venue(2, 500, ['ex-2']), venue(1, 100, ['ex-1a', 'ex-1b'])],
			origin,
		);

		expect(regions).toHaveLength(1);
		expect(regions[0].museumId).toBe(1);
		expect(regions[0].exhibitions).toHaveLength(3);
		expect(regions[0].exhibitions[0].museumId).toBe(1);
		expect(regions[0].exhibitions[0].id).toBe('ex-1a');
	});

	it('limits geofences to the closest twenty regions within twenty kilometers', () => {
		const venues = Array.from({ length: 24 }, (_, index) =>
			venue(index + 1, index * 1000, [`ex-${index}`]),
		);
		const regions = selectNearbyAlertRegions(venues, origin);

		expect(regions).toHaveLength(20);
		expect(regions[0].museumId).toBe(1);
		expect(regions.at(-1)?.museumId).toBe(20);
		expect(NEARBY_ALERT_RADIUS_METERS).toBe(800);
	});

	it('does not register invalid coordinates, empty venues, or distant exhibitions', () => {
		const regions = selectNearbyAlertRegions(
			[
				venue(1, 0, ['near']),
				venue(2, 40_000, ['far']),
				{ ...venue(3, 10, []), exhibitions: [] },
				{ ...venue(4, 10, ['bad']), latitude: 91 },
			],
			origin,
		);

		expect(regions.map((region) => region.museumId)).toEqual([1]);
	});

	it('rejects invalid dates and accepts an exhibition active through its end date', () => {
		expect(isExhibitionActive('invalid', '2026.10.20', new Date(2026, 9, 18))).toBe(false);
		expect(isExhibitionActive('2026.10.01', '2026.10.18', new Date(2026, 9, 18, 23, 59))).toBe(
			true,
		);
		expect(isExhibitionActive('2026.10.01', '2026.10.17', new Date(2026, 9, 18))).toBe(false);
	});

	it('allows only one alert per 24 hours and two in a rolling seven days', () => {
		const now = Date.now();
		const decide = (deliveries: NearbyAlertDelivery[]) =>
			canSendNearbyExhibitionAlert({
				exhibitionId: 'ex-new',
				now,
				deliveries,
				lastForegroundAt: now - 2 * 60 * 60 * 1000,
			});

		expect(
			decide([{ exhibitionId: 'ex-old', sentAt: now - NEARBY_ALERT_DAILY_LIMIT_MS + 1 }]),
		).toBe(false);
		expect(
			decide([
				{ exhibitionId: 'ex-a', sentAt: now - 2 * 24 * 60 * 60 * 1000 },
				{ exhibitionId: 'ex-b', sentAt: now - 4 * 24 * 60 * 60 * 1000 },
			]),
		).toBe(false);
		expect(decide([{ exhibitionId: 'ex-old', sentAt: now - 8 * 24 * 60 * 60 * 1000 }])).toBe(true);
	});

	it('keeps one OS slot for the boundary region and never alerts on boundary entry', () => {
		const venues = Array.from({ length: 24 }, (_, index) =>
			venue(index + 1, index * 1000, [`ex-${index}`]),
		);
		const geofences = buildNearbyGeofences(
			selectNearbyAlertRegions(venues, origin, NEARBY_ALERT_MAX_VENUE_REGIONS),
			origin,
		);

		expect(geofences).toHaveLength(NEARBY_ALERT_MAX_REGIONS);
		const boundary = geofences.at(-1);
		expect(boundary).toEqual({
			identifier: NEARBY_ALERT_BOUNDARY_ID,
			latitude: origin.latitude,
			longitude: origin.longitude,
			radius: NEARBY_ALERT_BOUNDARY_RADIUS_METERS,
			notifyOnEnter: false,
			notifyOnExit: true,
		});
		expect(geofences.filter((item) => item.identifier === NEARBY_ALERT_BOUNDARY_ID)).toHaveLength(
			1,
		);
	});

	it('registers only the boundary region when no venue is nearby', () => {
		const geofences = buildNearbyGeofences(
			selectNearbyAlertRegions([venue(1, 40_000, ['far'])], origin),
			origin,
		);

		expect(geofences.map((item) => item.identifier)).toEqual([NEARBY_ALERT_BOUNDARY_ID]);
	});

	it('drops ended exhibitions and empty venues from the cached venue list', () => {
		const ended = { ...venue(1, 0, ['ended']) };
		ended.exhibitions = ended.exhibitions.map((item) => ({ ...item, endDate: '2026.10.10' }));
		const mixed = venue(2, 0, ['live', 'old']);
		mixed.exhibitions[1] = { ...mixed.exhibitions[1], endDate: '2026.10.10' };

		const active = filterActiveVenues([ended, mixed], new Date(2026, 9, 19));

		expect(active.map((item) => item.museumId)).toEqual([2]);
		expect(active[0].exhibitions.map((item) => item.id)).toEqual(['live']);
	});

	it('suppresses the same exhibition for fourteen days and during recent app use', () => {
		const now = Date.now();
		const deliveries = [{ exhibitionId: 'ex-1', sentAt: now - NEARBY_ALERT_COOLDOWN_MS + 1 }];
		expect(
			canSendNearbyExhibitionAlert({
				exhibitionId: 'ex-1',
				now,
				deliveries,
				lastForegroundAt: now - 2 * 60 * 60 * 1000,
			}),
		).toBe(false);
		expect(
			canSendNearbyExhibitionAlert({
				exhibitionId: 'ex-2',
				now,
				deliveries: [],
				lastForegroundAt: now - 30 * 60 * 1000,
			}),
		).toBe(false);
		expect(
			canSendNearbyExhibitionAlert({
				exhibitionId: 'ex-1',
				now,
				deliveries: [{ exhibitionId: 'ex-1', sentAt: now - NEARBY_ALERT_COOLDOWN_MS }],
				lastForegroundAt: now - 2 * 60 * 60 * 1000,
			}),
		).toBe(true);
	});
});
