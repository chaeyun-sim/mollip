import { useMemo } from 'react';

import type { VenueGroup } from '@/src/data/venues';
import { declutterMarkers } from '@/src/utils/mapUtils';

interface UseMapMarkersOptions {
	mapVenues: VenueGroup[];
	dbVenues: VenueGroup[];
	selectedVenueName: string | null;
	displayZoom: number;
	filterDate: Date;
	directionsStatus: string;
	routeOriginName: string | undefined;
	destinationName: string | undefined;
}

export function useMapMarkers({
	mapVenues,
	dbVenues,
	selectedVenueName,
	displayZoom,
	filterDate,
	directionsStatus,
	routeOriginName,
	destinationName,
}: UseMapMarkersOptions) {
	const pinnedVenueName = useMemo(() => {
		if (directionsStatus === 'idle') return null;
		return destinationName ?? selectedVenueName;
	}, [directionsStatus, destinationName, selectedVenueName]);

	const markerVenues = useMemo(() => {
		const pinNames = new Set<string>();
		if (selectedVenueName) pinNames.add(selectedVenueName);
		if (pinnedVenueName) pinNames.add(pinnedVenueName);

		// 경로 모드: 출발지·목적지 핀만 표시
		if (directionsStatus !== 'idle') {
			const routePinNames = new Set<string>();
			if (routeOriginName) routePinNames.add(routeOriginName);
			if (destinationName) routePinNames.add(destinationName);
			const routeVenues = [...mapVenues, ...dbVenues].filter((v) =>
				routePinNames.has(v.venueName),
			);
			// 중복 제거
			const seen = new Set<string>();
			return routeVenues.filter((v) => {
				if (seen.has(v.venueName)) return false;
				seen.add(v.venueName);
				return true;
			});
		}

		if (pinNames.size === 0) return mapVenues;
		const missing = dbVenues.filter(
			(v) =>
				pinNames.has(v.venueName) &&
				!mapVenues.some((m) => m.venueName === v.venueName),
		);
		return missing.length > 0 ? [...mapVenues, ...missing] : mapVenues;
	}, [
		mapVenues,
		dbVenues,
		selectedVenueName,
		pinnedVenueName,
		directionsStatus,
		routeOriginName,
		destinationName,
	]);

	const { full: fullMarkerVenues, dots: dotVenues } = useMemo(
		() =>
			declutterMarkers(
				markerVenues,
				displayZoom,
				selectedVenueName,
				filterDate,
				pinnedVenueName,
			),
		[markerVenues, displayZoom, selectedVenueName, filterDate, pinnedVenueName],
	);

	return { pinnedVenueName, fullMarkerVenues, dotVenues };
}
