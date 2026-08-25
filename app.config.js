const { readFileSync } = require('fs');
const { resolve } = require('path');
const { withInfoPlist } = require('@expo/config-plugins');

// .env 파일을 prebuild 시에도 로드
try {
	const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
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
		name: 'mollip',
		slug: 'mollip',
		scheme: 'mollip',
		owner: 'bysimune',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/icon.png',
		userInterfaceStyle: 'light',
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.simune.aaa',
			usesAppleSignIn: true,
			infoPlist: {
				NSPhotoLibraryUsageDescription: '사진 라이브러리에 접근합니다.',
				NSCameraUsageDescription: '카메라를 사용합니다.',
				NSMicrophoneUsageDescription: '마이크를 사용합니다.',
				NSLocationWhenInUseUsageDescription:
					'주변 전시관을 지도에 표시하기 위해 위치 정보를 사용합니다.',
				NSLocationAlwaysAndWhenInUseUsageDescription:
					'주변 전시관을 지도에 표시하기 위해 위치 정보를 사용합니다.',
				NMFClientId: NAVER_CLIENT_ID,
				// 문화포털(culture.go.kr) 전시 썸네일이 HTTP로만 제공되어 ATS 예외 필요
				NSAppTransportSecurity: {
					NSExceptionDomains: {
						'culture.go.kr': {
							NSIncludesSubdomains: true,
							NSExceptionAllowsInsecureHTTPLoads: true,
						},
					},
				},
				LSApplicationQueriesSchemes: ['kakaolink', 'kakaokompassauth', 'storykompassauth'],
			},
		},
		android: {
			package: 'com.simune.aaa',
			adaptiveIcon: {
				backgroundColor: '#E6F4FE',
				foregroundImage: './assets/icon.png',
			},
			predictiveBackGestureEnabled: false,
		},
		web: {
			favicon: './assets/favicon.png',
		},
		plugins: [
			[
				'expo-build-properties',
				{
					android: {
						extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
					},
				},
			],
			[
				'@react-native-kakao/core',
				{
					nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_API_KEY,
					android: {
						forwardKakaoLinkIntentFilterToMainActivity: true,
					},
				},
			],
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
			'expo-image',
			'expo-splash-screen',
			'expo-apple-authentication',
			[
				'expo-notifications',
				{
					icon: './assets/icon.png',
					color: '#1C1917',
					sounds: [],
					mode: 'production',
				},
			],
			// NMFClientId를 마지막에 강제 주입 (다른 플러그인이 덮어쓰는 것 방지)
			(config) =>
				withInfoPlist(config, (c) => {
					c.modResults.NMFClientId = NAVER_CLIENT_ID;
					return c;
				}),
		],
		extra: {
			eas: {
				projectId: '1d491184-25a6-4d90-aa1e-fe92374c6962',
			},
		},
	},
};
