import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { RouteEndpoint } from '@/src/hooks/useDirections';

export interface RecentRoute {
	origin: RouteEndpoint;
	destination: RouteEndpoint;
}

const STORAGE_KEY = 'recent_routes_v1';
const MAX_COUNT = 5;

function toKey(route: RecentRoute) {
	return `${route.origin.name}->${route.destination.name}`;
}

/** 완료한 길찾기(출발지→도착지) 기록 — 지도 검색바 focus 시 다시 띄워준다. */
export function useRecentRoutes() {
	const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

	useEffect(() => {
		AsyncStorage.getItem(STORAGE_KEY)
			.then((raw) => {
				if (raw) setRecentRoutes(JSON.parse(raw));
			})
			.catch(() => {});
	}, []);

	const addRecentRoute = useCallback((origin: RouteEndpoint, destination: RouteEndpoint) => {
		const next: RecentRoute = { origin, destination };
		setRecentRoutes((prev) => {
			const key = toKey(next);
			const filtered = prev.filter((r) => toKey(r) !== key);
			const updated = [next, ...filtered].slice(0, MAX_COUNT);
			AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
			return updated;
		});
	}, []);

	return { recentRoutes, addRecentRoute };
}
