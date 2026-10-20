const { readFileSync } = require('fs');
const { resolve } = require('path');
const { withInfoPlist, withPodfile } = require('@expo/config-plugins');

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
		owner: 'simune',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/logo/icon.png',
		userInterfaceStyle: 'light',
		ios: {
			supportsTablet: false,
			bundleIdentifier: 'com.simune.mollip',
			usesAppleSignIn: true,
			config: {
				usesNonExemptEncryption: false,
			},
			infoPlist: {
				CFBundleDisplayName: '몰립',
				CFBundleName: '몰립',
				// 사진·카메라·위치 권한 문구는 아래 expo-image-picker / expo-location 플러그인에서 지정한다
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
			package: 'com.simune.mollip',
			adaptiveIcon: {
				backgroundColor: '#E6F4FE',
				foregroundImage: './assets/images/logo/icon.png',
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
					ios: {
						usePrecompiledModules: false,
						buildReactNativeFromSource: true,
					},
					android: {
						extraMavenRepos: [
							'https://devrepo.kakao.com/nexus/content/groups/public/',
							'https://repository.map.naver.com/archive/maven',
						],
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
					photosPermission:
						'작품 사진으로 AI 해설을 만들고 관람 기록에 사진을 첨부하기 위해 사진 보관함에 접근합니다.',
					cameraPermission:
						'작품을 촬영해 AI 해설을 만들고 관람 기록에 사진을 남기기 위해 카메라를 사용합니다.',
					// 동영상 촬영을 하지 않으므로 마이크 권한을 요청하지 않는다
					microphonePermission: false,
				},
			],
			'expo-font',
			'expo-image',
			[
				'expo-location',
				{
					locationWhenInUsePermission: '지도에서 내 주변 전시관을 찾기 위해 위치를 사용합니다.',
					locationAlwaysAndWhenInUsePermission:
						'근처 전시 알림을 켠 경우, 주변 전시에 도착했을 때 알려드리기 위해 위치를 사용합니다. 이동 경로는 저장하거나 전송하지 않습니다.',
					locationAlwaysPermission:
						'근처 전시 알림을 켠 경우, 주변 전시에 도착했을 때 알려드리기 위해 위치를 사용합니다. 이동 경로는 저장하거나 전송하지 않습니다.',
					// 활동(모션) 인식을 쓰지 않으므로 모션 권한 문구를 넣지 않는다
					motionUsagePermission: false,
					isIosBackgroundLocationEnabled: true,
					isAndroidBackgroundLocationEnabled: true,
				},
			],
			[
				'expo-splash-screen',
				{
					backgroundColor: '#F8F6F2',
					image: './assets/images/logo/logo.png',
					imageWidth: 180,
				},
			],
			[
				'expo-secure-store',
				{
					configureAndroidBackup: true,
					// 생체 인증 보호(requireAuthentication)를 쓰지 않으므로 Face ID 권한 문구를 넣지 않는다
					faceIDPermission: false,
				},
			],
			'expo-sqlite',
			'expo-apple-authentication',
			[
				'expo-notifications',
				{
					icon: './assets/images/logo/logo.png',
					color: '#1C1917',
					sounds: [],
					mode: 'production',
				},
			],
			[
				'@sentry/react-native/expo',
				{
					url: 'https://sentry.io/',
					organization: process.env.EXPO_PUBLIC_SENTRY_ORG_SLUG,
					project: process.env.EXPO_PUBLIC_SENTRY_PROJECT_SLUG,
				},
			],
			(config) =>
				withPodfile(config, (c) => {
					const marker = 'post_install do |installer|\n';
					if (
						!c.modResults.contents.includes(
							"build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'",
						)
					) {
						c.modResults.contents = c.modResults.contents.replace(
							marker,
							`${marker}    # React Native 0.85 headers use std::shared_mutex in Expo pods too.\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |build_configuration|\n        build_configuration.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'\n      end\n    end\n`,
						);
					}
					return c;
				}),
			// NMFClientId를 마지막에 강제 주입 (다른 플러그인이 덮어쓰는 것 방지)
			(config) =>
				withInfoPlist(config, (c) => {
					c.modResults.NMFClientId = NAVER_CLIENT_ID;
					return c;
				}),
		],
		extra: {
			eas: {
				projectId: '9673e3b0-68ac-4c39-8517-0296ed8f9733',
			},
		},
	},
};
