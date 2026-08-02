import { useCallback, useRef, useState } from 'react';
import { getTransitRoutes, getWalkingRoute, type RouteCoord, type RouteResult } from '@/src/api/tmap';

export type DirectionsMode = 'walk' | 'bus';
export type DirectionsStatus = 'idle' | 'planning' | 'loading' | 'success' | 'error';

export interface RouteEndpoint {
	name: string;
	coord: RouteCoord;
}

function routeCacheKey(start: RouteCoord, end: RouteCoord): string {
	return `${start.latitude},${start.longitude}->${end.latitude},${end.longitude}`;
}

export function useDirections() {
	const [mode, setMode] = useState<DirectionsMode>('walk');
	const [walkRoute, setWalkRoute] = useState<RouteResult | null>(null);
	const [routes, setRoutes] = useState<RouteResult[]>([]);
	const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
	const [status, setStatus] = useState<DirectionsStatus>('idle');
	const [origin, setOrigin] = useState<RouteEndpoint | null>(null);
	const [destination, setDestination] = useState<RouteEndpoint | null>(null);
	const cacheRef = useRef<{
		key: string;
		walk?: RouteResult;
		bus?: RouteResult[];
	}>({ key: '' });

	const fetchRouteWithEndpoints = useCallback(
		async (start: RouteEndpoint, end: RouteEndpoint, requestedMode: DirectionsMode) => {
			const key = routeCacheKey(start.coord, end.coord);
			if (cacheRef.current.key !== key) {
				cacheRef.current = { key };
			}
			setMode(requestedMode);
			setOrigin(start);
			setDestination(end);
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
					const result = await getWalkingRoute(
						start.coord,
						end.coord,
						start.name,
						end.name,
					);
					if (!result || result.legs.length === 0) {
						setWalkRoute(null);
						setStatus('error');
						return;
					}
					cacheRef.current.walk = result;
					setWalkRoute(result);
					setStatus('success');
				} catch {
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
				const result = await getTransitRoutes(start.coord, end.coord);
				if (result.length === 0) {
					setRoutes([]);
					setStatus('error');
					return;
				}
				cacheRef.current.bus = result;
				setRoutes(result);
				setStatus('success');
			} catch {
				setRoutes([]);
				setStatus('error');
			}
		},
		[],
	);

	const beginPlanning = useCallback(
		(end: RouteEndpoint, defaultStart: RouteEndpoint | null) => {
			setDestination(end);
			setOrigin(defaultStart);
			setWalkRoute(null);
			setRoutes([]);
			setSelectedRouteIndex(0);
			setStatus('planning');
		},
		[],
	);

	const confirmRoute = useCallback(
		(requestedMode: DirectionsMode = 'walk') => {
			if (!origin || !destination) return;
			return fetchRouteWithEndpoints(origin, destination, requestedMode);
		},
		[origin, destination, fetchRouteWithEndpoints],
	);

	const swapEndpoints = useCallback(() => {
		if (!origin || !destination) return;
		setOrigin(destination);
		setDestination(origin);
	}, [origin, destination]);

	const selectRoute = useCallback((index: number) => {
		setSelectedRouteIndex(index);
	}, []);

	const clearRoute = useCallback(() => {
		setWalkRoute(null);
		setRoutes([]);
		setSelectedRouteIndex(0);
		setStatus('idle');
		setDestination(null);
		setOrigin(null);
		cacheRef.current = { key: '' };
	}, []);

	const route = mode === 'walk' ? walkRoute : (routes[selectedRouteIndex] ?? null);

	return {
		mode,
		route,
		routes,
		selectedRouteIndex,
		status,
		origin,
		destination,
		setOrigin,
		setDestination,
		beginPlanning,
		confirmRoute,
		swapEndpoints,
		selectRoute,
		clearRoute,
	};
};
