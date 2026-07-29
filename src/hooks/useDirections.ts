import { useCallback, useState } from 'react';
import { getTransitRoute, getWalkingRoute, type RouteCoord, type RouteResult } from '@/src/api/tmap';

export type DirectionsMode = 'walk' | 'bus';
type Status = 'idle' | 'loading' | 'success' | 'error';

export function useDirections() {
	const [mode, setMode] = useState<DirectionsMode>('walk');
	const [route, setRoute] = useState<RouteResult | null>(null);
	const [status, setStatus] = useState<Status>('idle');

	const fetchRoute = useCallback(
		async (
			start: RouteCoord,
			end: RouteCoord,
			startName: string,
			endName: string,
			requestedMode: DirectionsMode,
		) => {
			setMode(requestedMode);
			setStatus('loading');
			try {
				const result =
					requestedMode === 'walk'
						? await getWalkingRoute(start, end, startName, endName)
						: await getTransitRoute(start, end);
				if (!result || result.legs.length === 0) {
					setRoute(null);
					setStatus('error');
					return;
				}
				setRoute(result);
				setStatus('success');
			} catch {
				setRoute(null);
				setStatus('error');
			}
		},
		[],
	);

	const clearRoute = useCallback(() => {
		setRoute(null);
		setStatus('idle');
	}, []);

	return { mode, route, status, fetchRoute, clearRoute };
}
