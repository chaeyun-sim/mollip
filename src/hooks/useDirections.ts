import { useCallback, useRef, useState } from 'react';
import { getTransitRoutes, getWalkingRoute, type RouteCoord, type RouteResult } from '@/src/api/tmap';

export type DirectionsMode = 'walk' | 'bus';
type Status = 'idle' | 'loading' | 'success' | 'error';

export function useDirections() {
	const [mode, setMode] = useState<DirectionsMode>('walk');
	// 도보는 후보가 1개뿐이라 walkRoute에, 버스는 후보 전체가 routes에 들어간다.
	const [walkRoute, setWalkRoute] = useState<RouteResult | null>(null);
	const [routes, setRoutes] = useState<RouteResult[]>([]);
	const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
	const [status, setStatus] = useState<Status>('idle');
	// selectedVenue는 목록이 새로고침되는 동안 잠깐 null이 될 수 있어, 목적지 이름/좌표는
	// 여기 별도로 저장해 도보/버스 전환이 그 상태 변화에 휘둘리지 않게 한다.
	const [destination, setDestination] = useState<{ name: string; coord: RouteCoord } | null>(null);
	// 목적지가 같은 동안은 도보/버스 탭을 오가도 API를 다시 호출하지 않도록 캐싱한다.
	const cacheRef = useRef<{
		destinationKey: string;
		walk?: RouteResult;
		bus?: RouteResult[];
	}>({ destinationKey: '' });

	const fetchRoute = useCallback(
		async (
			start: RouteCoord,
			end: RouteCoord,
			startName: string,
			endName: string,
			requestedMode: DirectionsMode,
		) => {
			const destinationKey = `${end.latitude},${end.longitude}`;
			if (cacheRef.current.destinationKey !== destinationKey) {
				cacheRef.current = { destinationKey };
			}
			setMode(requestedMode);
			setDestination({ name: endName, coord: end });
			setSelectedRouteIndex(0);

			if (requestedMode === 'walk') {
				const cached = cacheRef.current.walk;
				if (cached) {
					setWalkRoute(cached);
					setStatus('success');
					return;
				}
				setStatus('loading');
				try {
					const result = await getWalkingRoute(start, end, startName, endName);
					if (!result || result.legs.length === 0) {
						setWalkRoute(null);
						setStatus('error');
						return;
					}
					cacheRef.current.walk = result;
					setWalkRoute(result);
					setStatus('success');
				} catch (err) {
					console.log('[DEBUG] 경로 조회 실패', err);
					setWalkRoute(null);
					setStatus('error');
				}
				return;
			}

			const cachedRoutes = cacheRef.current.bus;
			if (cachedRoutes) {
				setRoutes(cachedRoutes);
				setStatus(cachedRoutes.length > 0 ? 'success' : 'error');
				return;
			}
			setStatus('loading');
			try {
				const result = await getTransitRoutes(start, end);
				if (result.length === 0) {
					setRoutes([]);
					setStatus('error');
					return;
				}
				cacheRef.current.bus = result;
				setRoutes(result);
				setStatus('success');
			} catch (err) {
				console.log('[DEBUG] 경로 조회 실패', err);
				setRoutes([]);
				setStatus('error');
			}
		},
		[],
	);

	const selectRoute = useCallback((index: number) => {
		setSelectedRouteIndex(index);
	}, []);

	const clearRoute = useCallback(() => {
		setWalkRoute(null);
		setRoutes([]);
		setSelectedRouteIndex(0);
		setStatus('idle');
	}, []);

	const route = mode === 'walk' ? walkRoute : (routes[selectedRouteIndex] ?? null);

	return {
		mode,
		route,
		routes,
		selectedRouteIndex,
		status,
		destination,
		fetchRoute,
		selectRoute,
		clearRoute,
	};
}
