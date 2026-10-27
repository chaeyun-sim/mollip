import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, View } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { NotificationPreferenceRow } from '@/src/components/notifications/NotificationPreferenceRow';
import {
	disableNearbyExhibitionAlerts,
	enableNearbyExhibitionAlerts,
	hasNearbyAlertPermissions,
	isNearbyExhibitionAlertEnabled,
	NearbyAlertSetupError,
} from '@/src/services/nearbyExhibitionAlerts';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';

type NotificationPrefs = {
	weekly_recommendation: boolean;
	visit_review: boolean;
	bookmark_deadline: boolean;
	venue_follow: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
	weekly_recommendation: true,
	visit_review: true,
	bookmark_deadline: true,
	venue_follow: true,
};

export default function NotificationSettingsScreen() {
	const { t } = useTranslation();

	const { userId } = useAuthStore(useShallow((s) => ({ userId: s.user?.id })));
	const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
	const [nearbyEnabled, setNearbyEnabled] = useState(false);
	const [nearbyBusy, setNearbyBusyState] = useState(false);

	useEffect(() => {
		if (!userId) return;

		supabase
			.from('profiles')
			.select('notification_prefs')
			.eq('id', userId)
			.maybeSingle()
			.then(({ data, error }) => {
				if (error || !data?.notification_prefs) return;
				setPrefs({ ...DEFAULT_PREFS, ...(data.notification_prefs as Partial<NotificationPrefs>) });
			});
	}, [userId]);

	// 권한 철회 등으로 기능이 꺼졌을 수 있으므로 화면 포커스·앱 복귀 때마다 실제 상태를 다시 읽는다.
	// 켜기/끄기 처리 중(권한 팝업으로 앱이 inactive→active 되는 경우 포함)에는 결과를 덮어쓰지 않는다.
	// 켜기/끄기가 시작·종료될 때마다 순번을 올려, 그 전에 시작된 동기화 결과는 버린다.
	const nearbyBusyRef = useRef(false);
	const nearbySyncSeqRef = useRef(0);
	const setNearbyBusy = useCallback((busy: boolean) => {
		nearbyBusyRef.current = busy;
		nearbySyncSeqRef.current += 1;
		setNearbyBusyState(busy);
	}, []);
	const syncNearbyEnabled = useCallback(async () => {
		const seq = ++nearbySyncSeqRef.current;
		const enabled =
			(await isNearbyExhibitionAlertEnabled()) &&
			(await hasNearbyAlertPermissions().catch(() => false));
		if (seq === nearbySyncSeqRef.current && !nearbyBusyRef.current) setNearbyEnabled(enabled);
	}, []);

	useFocusEffect(
		useCallback(() => {
			void syncNearbyEnabled();
			const subscription = AppState.addEventListener('change', (state) => {
				if (state === 'active') void syncNearbyEnabled();
			});
			return () => subscription.remove();
		}, [syncNearbyEnabled]),
	);

	const toggle = useCallback(
		(key: keyof NotificationPrefs) => (value: boolean) => {
			if (!userId) return;

			const next = { ...prefs, [key]: value };
			setPrefs(next);

			supabase
				.from('profiles')
				.update({ notification_prefs: next })
				.eq('id', userId)
				.then(({ error }) => {
					if (error) {
						console.warn('[notification-prefs] 저장 실패:', error.message);
						setPrefs(prefs);
					}
				});
		},
		[prefs, userId],
	);

	const handleNearbyAlertChange = useCallback(
		(value: boolean) => {
			if (nearbyBusy) return;
			if (!value) {
				setNearbyBusy(true);
				void disableNearbyExhibitionAlerts()
					.then(() => setNearbyEnabled(false))
					.catch((error) => {
						Alert.alert('알림을 끄지 못했어요', '잠시 후 다시 시도해 주세요.');
						console.warn('[nearby-alert] 비활성화 실패:', error);
					})
					.finally(() => setNearbyBusy(false));
				return;
			}

			Alert.alert(
				'근처 전시 알림을 켤까요?',
				'주변 전시에 도착했을 때 알려드리려면 알림과 백그라운드 위치 접근이 필요해요. 위치 이동 경로는 저장하거나 전송하지 않아요.',
				[
					{ text: t('common.cancel'), style: 'cancel' },
					{
						text: '계속하기',
						onPress: () => {
							setNearbyBusy(true);
							void (async () => {
								let notification = await Notifications.getPermissionsAsync();
								if (!notification.granted) {
									notification = await Notifications.requestPermissionsAsync();
								}
								const notificationAllowed =
									notification.granted ||
									notification.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
								if (!notificationAllowed || notification.ios?.allowsAlert === false) {
									throw new NearbyAlertSetupError(
										'기기 설정에서 몰립의 알림을 허용해 주세요.',
										true,
									);
								}

								let foreground = await Location.getForegroundPermissionsAsync();
								if (foreground.status !== 'granted') {
									foreground = await Location.requestForegroundPermissionsAsync();
								}
								if (foreground.status !== 'granted') {
									throw new NearbyAlertSetupError(
										'주변 전시를 찾을 수 있도록 위치 접근을 허용해 주세요.',
										true,
									);
								}

								let background = await Location.getBackgroundPermissionsAsync();
								if (background.status !== 'granted') {
									background = await Location.requestBackgroundPermissionsAsync();
								}
								if (background.status !== 'granted') {
									throw new NearbyAlertSetupError(
										'백그라운드 위치 접근을 허용해야 근처 전시 알림을 받을 수 있어요.',
										true,
									);
								}

								await enableNearbyExhibitionAlerts();
								setNearbyEnabled(true);
							})()
								.catch((error) => {
									// 서버·SDK 원문 오류는 노출하지 않고 일반 안내로 바꾼다.
									const isSetupError = error instanceof NearbyAlertSetupError;
									const message = isSetupError
										? error.message
										: '위치 알림을 설정하지 못했어요. 네트워크와 권한을 확인해 주세요.';
									const needsSettings = isSetupError && error.needsSettings;
									Alert.alert(
										'알림을 켤 수 없어요',
										message,
										needsSettings
											? [
													{ text: t('common.cancel'), style: 'cancel' },
													{ text: '설정 열기', onPress: () => void Linking.openSettings() },
												]
											: [{ text: t('common.confirm') }],
									);
									console.warn('[nearby-alert] 활성화 실패:', error);
								})
								.finally(() => setNearbyBusy(false));
						},
					},
				],
			);
		},
		[nearbyBusy, setNearbyBusy, t],
	);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>알림 설정</Screen.Header.Center>
			</Screen.Header>

			<View className="pt-2">
				<View>
					<NotificationPreferenceRow
						label="이번주 추천 전시 알림"
						value={prefs.weekly_recommendation}
						onValueChange={toggle('weekly_recommendation')}
					/>
					<NotificationPreferenceRow
						label="관람 후 리뷰 추천 알림"
						value={prefs.visit_review}
						onValueChange={toggle('visit_review')}
					/>
					<NotificationPreferenceRow
						label="찜한 전시 마감임박 알림"
						value={prefs.bookmark_deadline}
						onValueChange={toggle('bookmark_deadline')}
					/>
					<NotificationPreferenceRow
						label="팔로우한 미술관/박물관 새 소식"
						value={prefs.venue_follow}
						onValueChange={toggle('venue_follow')}
					/>
					<NotificationPreferenceRow
						label="현재 위치 기반 근처 전시 알림"
						value={nearbyEnabled}
						onValueChange={handleNearbyAlertChange}
						disabled={nearbyBusy}
					/>
				</View>
			</View>
		</Screen>
	);
}
