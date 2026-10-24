import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export function useUserLocation() {
	const [currentCoord, setCurrentCoord] = useState<{ latitude: number; longitude: number } | null>(
		null,
	);

	useEffect(() => {
		(async () => {
			// 온보딩에서 이미 요청했으므로 현재 상태만 확인.
			// undetermined면 한 번 요청한다(기존 사용자 fallback).
			let { status } = await Location.getForegroundPermissionsAsync();
			if (status === 'undetermined') {
				({ status } = await Location.requestForegroundPermissionsAsync());
			}
			if (status !== 'granted') return;
			try {
				const loc = await Location.getCurrentPositionAsync({});
				setCurrentCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
			} catch {
				// 시뮬레이터·실내 등 위치를 못 가져오는 환경 — 조용히 무시하고 currentCoord는 null 유지
			}
		})();
	}, []);

	return { currentCoord, hasLocation: currentCoord !== null };
}
