import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AnalyticsSdk = typeof import('@react-native-firebase/analytics');
interface AnalyticsClient {
	sdk: AnalyticsSdk;
	instance: ReturnType<AnalyticsSdk['getAnalytics']>;
}

let clientPromise: Promise<AnalyticsClient | null> | null = null;
let didWarn = false;

const reportUnavailable = () => {
	if (__DEV__ && !didWarn) {
		didWarn = true;
		console.warn('[analytics] 전송하지 못했습니다. Firebase 설정과 네이티브 빌드를 확인해 주세요.');
	}
};

const getClient = async (): Promise<AnalyticsClient | null> => {
	// Android 설정 파일은 아직 제공되지 않았다. Expo Go/이전 개발 빌드의 네이티브 모듈 누락도 격리한다.
	const { OS: platform } = Platform;
	if (platform !== 'ios' || Constants.expoConfig?.extra?.analyticsEnabled !== true) return null;
	if (!clientPromise) {
		clientPromise = (async () => {
			// 네이티브 모듈이 없는 개발 빌드에서도 앱 진입이 가능하도록 초기화 안에서만 로드한다.
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const sdk = require('@react-native-firebase/analytics') as AnalyticsSdk;
			const instance = sdk.getAnalytics();
			await sdk.setAnalyticsCollectionEnabled(instance, true);
			return { sdk, instance };
		})().catch(() => {
			clientPromise = null;
			reportUnavailable();
			return null;
		});
	}
	return clientPromise;
};

// SDK의 로컬 큐에 맡긴다. 실패한 이벤트를 앱에서 재전송해 중복 집계하지 않는다.
const sendEvent = async (
	name: string,
	parameters: Record<string, string | number>,
): Promise<boolean> => {
	try {
		const client = await getClient();
		if (!client) return false;
		await client.sdk.logEvent(client.instance, name, parameters);
		return true;
	} catch {
		reportUnavailable();
		return false;
	}
};

/** useSegments의 템플릿 경로만 전달한다. usePathname/검색어/사용자 입력 경로는 전달하지 않는다. */
export const trackScreenView = (screenName: string) =>
	sendEvent('screen_view', { screen_name: screenName, screen_class: 'ExpoRouter' });

export const trackExhibitionSelection = (id: string) =>
	sendEvent('select_content', { content_type: 'exhibition', item_id: id });

export const trackSearchSubmitted = (queryLength: number) =>
	sendEvent('search_submitted', { query_length: queryLength });

export const trackLogin = (method: 'apple' | 'kakao') => sendEvent('login', { method });
