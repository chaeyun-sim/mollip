// Tmap Open API — 보행자/대중교통 길찾기.
// https://tmapapi.tmapmobility.com/ 에서 앱 등록 후 appKey 발급.
const TMAP_APP_KEY = process.env.EXPO_PUBLIC_TMAP_APP_KEY ?? '';

export interface RouteCoord {
	latitude: number;
	longitude: number;
}

export type RouteLegMode = 'walk' | 'bus' | 'subway';

export interface RouteLeg {
	mode: RouteLegMode;
	coords: RouteCoord[];
}

export interface RouteResult {
	legs: RouteLeg[];
	distanceMeters: number;
	durationSeconds: number;
}

function toCoordParams(start: RouteCoord, end: RouteCoord) {
	return {
		startX: String(start.longitude),
		startY: String(start.latitude),
		endX: String(end.longitude),
		endY: String(end.latitude),
	};
}

// 도보 경로 — 좌표열이 GeoJSON LineString feature로 온다.
export async function getWalkingRoute(
	start: RouteCoord,
	end: RouteCoord,
	startName: string,
	endName: string,
): Promise<RouteResult> {
	const res = await fetch('https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			appKey: TMAP_APP_KEY,
		},
		body: JSON.stringify({
			...toCoordParams(start, end),
			startName: encodeURIComponent(startName).slice(0, 60),
			endName: encodeURIComponent(endName).slice(0, 60),
			reqCoordType: 'WGS84GEO',
			resCoordType: 'WGS84GEO',
			searchOption: '0',
		}),
	});
	if (!res.ok) throw new Error(`Tmap 보행자 경로 요청 실패 (${res.status})`);
	const json = await res.json();

	const coords: RouteCoord[] = [];
	let distanceMeters = 0;
	let durationSeconds = 0;
	for (const feature of json.features ?? []) {
		if (feature.properties?.totalDistance) distanceMeters = feature.properties.totalDistance;
		if (feature.properties?.totalTime) durationSeconds = feature.properties.totalTime;
		if (feature.geometry?.type === 'LineString') {
			for (const [lon, lat] of feature.geometry.coordinates as [number, number][]) {
				coords.push({ latitude: lat, longitude: lon });
			}
		}
	}

	return { legs: [{ mode: 'walk', coords }], distanceMeters, durationSeconds };
}

// 대중교통(버스/지하철) 경로 — 여러 구간(leg)으로 나뉘어 오고, 각 구간마다 이동수단이 다르다.
export async function getTransitRoute(
	start: RouteCoord,
	end: RouteCoord,
): Promise<RouteResult | null> {
	const res = await fetch('https://apis.openapi.sk.com/transit/routes', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			appKey: TMAP_APP_KEY,
		},
		body: JSON.stringify({
			...toCoordParams(start, end),
			count: 1,
			lang: 0,
			format: 'json',
		}),
	});
	if (!res.ok) throw new Error(`Tmap 대중교통 경로 요청 실패 (${res.status})`);
	const json = await res.json();
	const itinerary = json.metaData?.plan?.itineraries?.[0];
	if (!itinerary) return null;

	const legs: RouteLeg[] = [];
	for (const leg of itinerary.legs ?? []) {
		const mode: RouteLegMode =
			leg.mode === 'BUS' ? 'bus' : leg.mode === 'SUBWAY' ? 'subway' : 'walk';
		const linestring: string = leg.passShape?.linestring ?? '';
		const coords: RouteCoord[] = linestring
			.split(' ')
			.filter(Boolean)
			.map((pair) => {
				const [lon, lat] = pair.split(',').map(Number);
				return { latitude: lat, longitude: lon };
			});
		if (coords.length > 0) legs.push({ mode, coords });
	}

	return {
		legs,
		distanceMeters: itinerary.totalDistance ?? 0,
		durationSeconds: itinerary.totalTime ?? 0,
	};
}
