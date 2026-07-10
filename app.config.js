const { readFileSync } = require('fs');
const { resolve } = require('path');
const { withInfoPlist } = require('@expo/config-plugins');

// .env 파일을 prebuild 시에도 로드
try {
	const envFile = readFileSync(resolve(__dirname, '.env'), 'utf-8');
	envFile.split('\n').forEach((line) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) return;
		const idx = trimmed.indexOf('=');
		if (idx === -1) return;
		const key = trimmed.slice(0, idx).trim();
		const val = trimmed.slice(idx + 1).trim();
		if (key) process.env[key] = val;
	});
} catch (e) {
	console.warn('app.config.js: .env 로드 실패', e.message);
}

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
console.log('[app.config.js] NAVER_CLIENT_ID:', NAVER_CLIENT_ID ? '✓ 로드됨' : '✗ undefined');

module.exports = {
	expo: {
		name: 'my-app',
		slug: 'my-app',
		scheme: 'my-app',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/icon.png',
		userInterfaceStyle: 'light',
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.simune.aaa',
			infoPlist: {
				NSPhotoLibraryUsageDescription: '사진 라이브러리에 접근합니다.',
				NSCameraUsageDescription: '카메라를 사용합니다.',
				NSMicrophoneUsageDescription: '마이크를 사용합니다.',
				NSLocationWhenInUseUsageDescription: '주변 전시관을 지도에 표시하기 위해 위치 정보를 사용합니다.',
				NSLocationAlwaysAndWhenInUseUsageDescription: '주변 전시관을 지도에 표시하기 위해 위치 정보를 사용합니다.',
				NMFClientId: NAVER_CLIENT_ID,
			},
		},
		android: {
			adaptiveIcon: {
				backgroundColor: '#E6F4FE',
				foregroundImage: './assets/android-icon-foreground.png',
				backgroundImage: './assets/android-icon-background.png',
				monochromeImage: './assets/android-icon-monochrome.png',
			},
			predictiveBackGestureEnabled: false,
		},
		web: {
			favicon: './assets/favicon.png',
		},
		plugins: [
			[
				'@mj-studio/react-native-naver-map',
				{
					client_id: NAVER_CLIENT_ID,
				},
			],
			'expo-router',
			'expo-status-bar',
			[
				'expo-image-picker',
				{
					photosPermission: '사진 라이브러리에 접근합니다.',
					cameraPermission: '카메라를 사용합니다.',
				},
			],
			'expo-font',
			'expo-splash-screen',
			// NMFClientId를 마지막에 강제 주입 (다른 플러그인이 덮어쓰는 것 방지)
			(config) => withInfoPlist(config, (c) => {
				c.modResults.NMFClientId = NAVER_CLIENT_ID;
				return c;
			}),
		],
	},
};
