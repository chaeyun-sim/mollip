// ODsay Lab API — 도보/대중교통(버스/지하철) 길찾기.
// SK Tmap 대중교통 API는 무료 요금제가 월 10건뿐이라 개발/운영이 불가능해 ODsay로 교체했다.
// https://lab.odsay.com/ 에서 앱 등록 후 apiKey 발급 (무료 Basic 요금제 일 1,000건).
const ODSAY_API_KEY = process.env.EXPO_PUBLIC_ODSAY_API_KEY ?? '';

export interface RouteCoord {
	latitude: number;
	longitude: number;
}

export type RouteLegMode = 'walk' | 'bus' | 'subway';

export interface RouteLeg {
	mode: RouteLegMode;
	coords: RouteCoord[];
	sectionSeconds: number;
	distanceMeters: number;
	startName: string;
	endName: string;
	// 버스 번호(예: "32") 또는 지하철 노선명(예: "신분당선"). 도보 구간에는 없음.
	routeName?: string;
	// ODsay 공식 노선 타입 코드 — 버스는 busRouteType(간선/지선/광역 등), 지하철은 subwayCode(호선)
	// 문서 기준 값이라 routeName 문자열 매칭보다 신뢰도가 높다. 도보 구간에는 없음.
	routeType?: number;
	// 지나는 정류장/역 개수. 버스·지하철 구간에만 있음.
	stopCount?: number;
}

export interface RouteResult {
	legs: RouteLeg[];
	distanceMeters: number;
	durationSeconds: number;
	transferCount: number;
	fareWon?: number;
}

// "경도 위도|경도 위도|..." 형태의 폴리라인 문자열을 좌표 배열로 변환한다.
function parseGraphPolyline(graph: string | undefined): RouteCoord[] {
	if (!graph) return [];
	return graph.split('|').map((pair) => {
		const [lon, lat] = pair.split(' ').map(Number);
		return { latitude: lat, longitude: lon };
	});
}

function transitLegCount(path: any): number {
	return (path.rps ?? []).filter((rp: any) => rp.trafficType === 1 || rp.trafficType === 2).length;
}

function formatSearchTime(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
}

// 멀티모달 길찾기(maasRP) — searchPubTransPathT와 달리 도보 구간도
// routes[].xyInfos에 실제 도로를 따르는 상세 좌표가 들어있어 loadLane 없이 지도에 그릴 수 있다.
// searchMethod: 1=도보, 2=대중교통.
async function searchMaasPaths(
	start: RouteCoord,
	end: RouteCoord,
	searchMethod: '1' | '2',
): Promise<any[]> {
	const params = new URLSearchParams({
		apiKey: ODSAY_API_KEY,
		lang: '0',
		SX: String(start.longitude),
		SY: String(start.latitude),
		EX: String(end.longitude),
		EY: String(end.latitude),
		SearchTime: formatSearchTime(new Date()),
		SearchMethod: searchMethod,
	});
	const res = await fetch(`https://api.odsay.com/v1/api/maasRP?${params}`);
	if (!res.ok) throw new Error(`ODsay 경로 요청 실패 (${res.status})`);
	const json = await res.json();
	if (json.error) {
		console.log('[DEBUG maasRP error]', JSON.stringify(json.error));
		return [];
	}
	if (!json.result) {
		console.log('[DEBUG maasRP unexpected response]', JSON.stringify(json));
	}
	return json.result?.paths ?? [];
}

function buildRouteResult(path: any): RouteResult {
	const legs: RouteLeg[] = (path.rps ?? []).map((rp: any): RouteLeg => {
		if (rp.trafficType === 3) {
			// 도보 — routes[].xyInfos에 실제 도로를 따르는 상세 좌표가 들어있다.
			const coords: RouteCoord[] = (rp.routes ?? []).flatMap((route: any) =>
				(route.xyInfos ?? []).map((p: any) => ({ latitude: p.y, longitude: p.x })),
			);
			return {
				mode: 'walk',
				coords,
				sectionSeconds: (rp.duration ?? 0) * 60,
				distanceMeters: rp.distance ?? 0,
				startName: '',
				endName: '',
			};
		}

		const mode: RouteLegMode = rp.trafficType === 1 ? 'subway' : 'bus';
		const lane = rp.lane?.[0];
		return {
			mode,
			coords: parseGraphPolyline(rp.graph),
			sectionSeconds: (rp.duration ?? 0) * 60,
			distanceMeters: rp.distance ?? 0,
			startName: rp.startName ?? '',
			endName: rp.endName ?? '',
			routeName: mode === 'bus' ? lane?.busNo : lane?.name,
			routeType: lane?.type,
			stopCount: Math.max(0, (rp.passStopList?.stations?.length ?? 1) - 1),
		};
	});

	return {
		legs,
		distanceMeters: path.totalDistance ?? 0,
		durationSeconds: (path.totalTime ?? 0) * 60,
		transferCount: Math.max(0, transitLegCount(path) - 1),
		fareWon: path.totalPayment,
	};
}

// 도보 경로 — routes[].xyInfos의 실제 도로 좌표를 그대로 사용한다.
export async function getWalkingRoute(
	start: RouteCoord,
	end: RouteCoord,
	startName: string,
	endName: string,
): Promise<RouteResult> {
	const paths = await searchMaasPaths(start, end, '1');
	if (paths.length === 0) {
		return { legs: [], distanceMeters: 0, durationSeconds: 0, transferCount: 0 };
	}
	// 후보 중 첫 번째가 아니라 가장 짧은 거리의 경로를 고른다 — 첫 번째가 산을 크게 돌아가는
	// 등 비정상적으로 먼 경로일 수 있다.
	const path = paths.reduce((best, p) => (p.totalDistance < best.totalDistance ? p : best));
	const result = buildRouteResult(path);
	if (result.legs.length > 0) {
		result.legs[0].startName = startName;
		result.legs[result.legs.length - 1].endName = endName;
	}
	return result;
}

// 대중교통(버스/지하철) 경로 후보 전체 — ODsay가 돌려주는 path[]를 모두 변환해 반환한다.
// 최단 시간 순으로 정렬해 가장 추천할 만한 경로가 리스트 맨 위에 오게 한다.
export async function getTransitRoutes(
	start: RouteCoord,
	end: RouteCoord,
): Promise<RouteResult[]> {
	const paths = await searchMaasPaths(start, end, '2');
	return paths
		.slice()
		.sort((a, b) => a.totalTime - b.totalTime)
		.map(buildRouteResult);
}
