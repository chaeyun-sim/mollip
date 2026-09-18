import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { RouteEndpoint } from '@/src/hooks/useDirections';

export interface RecentLocation {
	name: string;
	subtitle?: string;
	coord: { latitude: number; longitude: number };
}

const MAX_COUNT = 6;

function toKey(loc: RecentLocation) {
	return `${loc.coord.latitude.toFixed(5)},${loc.coord.longitude.toFixed(5)}`;
}

/**
 * 최근 선택 위치 기록 — storageKey별로 완전히 독립된 목록을 저장한다.
 * 지도 검색바 "최근 방문한 곳", 길찾기 출발지, 길찾기 도착지가 서로 섞이지 않도록
 * 용도마다 다른 storageKey로 이 훅을 각각 인스턴스화해서 쓴다.
 */
export function useRecentEndpoints(storageKey: string) {
	const [recents, setRecents] = useState<RecentLocation[]>([]);

	useEffect(() => {
		AsyncStorage.getItem(storageKey)
			.then((raw) => {
				if (raw) setRecents(JSON.parse(raw));
			})
			.catch(() => {});
	}, [storageKey]);

	const addRecent = useCallback(
		(endpoint: RouteEndpoint, subtitle?: string) => {
			const next: RecentLocation = {
				name: endpoint.name,
				subtitle,
				coord: endpoint.coord,
			};
			setRecents((prev) => {
				const key = toKey(next);
				const filtered = prev.filter((r) => toKey(r) !== key);
				const updated = [next, ...filtered].slice(0, MAX_COUNT);
				AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
				return updated;
			});
		},
		[storageKey],
	);

	return { recents, addRecent };
}
