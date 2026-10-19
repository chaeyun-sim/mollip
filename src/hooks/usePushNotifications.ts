import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '@/src/utils/supabase';

// 포그라운드 알림 표시 설정
try {
	Notifications.setNotificationHandler({
		handleNotification: async () => ({
			shouldShowBanner: true,
			shouldShowList: true,
			shouldPlaySound: true,
			shouldSetBadge: false,
		}),
	});
} catch {
	// 네이티브 모듈 미빌드 환경(무료 개발자 계정)에서 무시
}

/** requestIfNeeded가 false면 권한 팝업 없이 이미 허용된 경우에만 토큰을 발급한다 (앱 복귀 시 재확인용). */
async function registerForPushNotifications(requestIfNeeded: boolean): Promise<string | null> {
	// 실기기에서만 APNs 토큰 발급이 가능하다 — 시뮬레이터/에뮬레이터에서는 건너뜀
	if (!Device.isDevice) return null;

	try {
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted' && requestIfNeeded) {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== 'granted') return null;

		if (Platform.OS === 'android') {
			await Notifications.setNotificationChannelAsync('default', {
				name: '전시 알림',
				importance: Notifications.AndroidImportance.MAX,
			});
		}

		const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
		const token = await Notifications.getExpoPushTokenAsync({ projectId });

		return token.data;
	} catch (error) {
		// 시뮬레이터 또는 권한 거부 시 토큰 발급 실패
		if (error instanceof Error) {
			console.warn('[push] 토큰 등록 실패:', error.message);
		}
		return null;
	}
}

export function usePushNotifications(userId: string | undefined) {
	useEffect(() => {
		if (!userId) return;

		let savedToken: string | null = null;
		const register = (requestIfNeeded: boolean) => {
			registerForPushNotifications(requestIfNeeded).then((token) => {
				if (!token || token === savedToken) return;
				supabase
					.from('profiles')
					.update({ push_token: token })
					.eq('id', userId)
					.then(({ error }) => {
						if (error) {
							console.error('[push] token 저장 실패:', error.message);
							return;
						}
						savedToken = token;
					});
			});
		};

		register(true);
		// 나중에 기기 설정(또는 알림 안내 화면)에서 권한을 허용하고 돌아온 경우에도 토큰을 등록한다.
		// 복귀할 때마다 권한 팝업을 다시 띄우지 않도록 여기서는 요청하지 않는다.
		const subscription = AppState.addEventListener('change', (state) => {
			if (state === 'active' && savedToken === null) register(false);
		});
		return () => subscription.remove();
	}, [userId]);
}
