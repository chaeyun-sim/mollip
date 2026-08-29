import { Linking } from 'react-native';
import type { RouteCoord } from '@/src/api/tmap';

export type ExternalMapApp = 'naver' | 'kakao' | 'google';

export const EXTERNAL_MAP_APPS: { key: ExternalMapApp; label: string }[] = [
	{ key: 'naver', label: '네이버 지도' },
	{ key: 'kakao', label: '카카오맵' },
	{ key: 'google', label: '구글 지도' },
];

const APP_BUNDLE_ID = 'com.simune.mollip';

// 앱 스킴으로 먼저 열어보고(설치돼 있으면 바로 해당 앱으로), 실패하면 웹 주소로 열어 브라우저에서라도 보이게 한다.
function buildUrls(
	app: ExternalMapApp,
	coord: RouteCoord,
	label: string,
): { appUrl: string; webUrl: string } {
	const { latitude, longitude } = coord;
	const name = encodeURIComponent(label);

	if (app === 'naver') {
		return {
			appUrl: `nmap://place?lat=${latitude}&lng=${longitude}&name=${name}&appname=${APP_BUNDLE_ID}`,
			webUrl: `https://map.naver.com/p/search/${name}`,
		};
	}
	if (app === 'kakao') {
		return {
			appUrl: `kakaomap://look?p=${latitude},${longitude}`,
			webUrl: `https://map.kakao.com/link/map/${name},${latitude},${longitude}`,
		};
	}
	return {
		appUrl: `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}`,
		webUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
	};
}

export async function openExternalMap(
	app: ExternalMapApp,
	coord: RouteCoord,
	label: string,
): Promise<void> {
	const { appUrl, webUrl } = buildUrls(app, coord, label);
	try {
		await Linking.openURL(appUrl);
	} catch {
		await Linking.openURL(webUrl);
	}
}
