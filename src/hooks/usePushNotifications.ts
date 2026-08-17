import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/src/utils/supabase';

// 포그라운드 알림 표시 설정
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

async function registerForPushNotifications(): Promise<string | null> {
	try {
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted') {
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

		registerForPushNotifications().then((token) => {
			if (!token) return;
			supabase
				.from('profiles')
				// push_token은 migration으로 추가된 컬럼 — 타입 생성 전 단언
				.update({ push_token: token } as never)
				.eq('id', userId)
				.then(({ error }) => {
					if (error) console.error('[push] token 저장 실패:', error.message);
				});
		});
	}, [userId]);
}
