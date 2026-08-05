import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NaverMapViewRef } from '@mj-studio/react-native-naver-map';

export const DEFAULT_CAMERA = { latitude: 37.5665, longitude: 126.978, zoom: 11 };

export function useMapCamera() {
	const mapRef = useRef<NaverMapViewRef>(null);
	const cameraRef = useRef({ ...DEFAULT_CAMERA });
	const zoomLevelRef = useRef(Math.round(DEFAULT_CAMERA.zoom));

	const [currentCoord, setCurrentCoord] = useState<{ latitude: number; longitude: number } | null>(null);
	const [displayZoom, setDisplayZoom] = useState(DEFAULT_CAMERA.zoom);

	useEffect(() => {
		(async () => {
			// 온보딩에서 이미 요청했으므로 현재 상태만 확인.
			// undetermined면(온보딩 건너뛴 기존 사용자 등) 한 번 요청한다.
			let { status } = await Location.getForegroundPermissionsAsync();
			if (status === 'undetermined') {
				({ status } = await Location.requestForegroundPermissionsAsync());
			}
			if (status !== 'granted') return;
			const loc = await Location.getCurrentPositionAsync({});
			const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
			setCurrentCoord(coord);
			mapRef.current?.animateCameraTo({ ...coord, zoom: 12 });
		})();
	}, []);

	const handleCameraChanged = useCallback(
		(cam: { latitude: number; longitude: number; zoom?: number }) => {
			cameraRef.current = {
				latitude: cam.latitude,
				longitude: cam.longitude,
				zoom: cam.zoom ?? 11,
			};
			const newLevel = Math.round(cam.zoom ?? 11);
			if (newLevel !== zoomLevelRef.current) {
				zoomLevelRef.current = newLevel;
				setDisplayZoom(newLevel);
			}
		},
		[],
	);

	return { mapRef, cameraRef, currentCoord, displayZoom, handleCameraChanged };
}
