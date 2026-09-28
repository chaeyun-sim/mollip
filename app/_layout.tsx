import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '../global.css';
import '../src/lib/iconInterop';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isRunningInExpoGo } from 'expo';
import * as Sentry from '@sentry/react-native';
import {
	CormorantGaramond_400Regular,
	CormorantGaramond_400Regular_Italic,
	CormorantGaramond_600SemiBold,
	CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
	Hahmlet_400Regular,
	Hahmlet_600SemiBold,
	Hahmlet_700Bold,
} from '@expo-google-fonts/hahmlet';
import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useRouter, useSegments, Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useShallow } from 'zustand/react/shallow';
import { Result } from '../src/components/common/Result';
import { Screen } from '../src/components/layout/Screen';
import { useArtistIntroStore } from '../src/store/artistIntroStore';
import { useImmersiveStore } from '../src/store/immersiveStore';
import { AuthProvider } from '../src/providers/AuthProvider';
import { ToastProvider } from '../src/providers/ToastProvider';
import { useAuthStore } from '../src/store/authStore';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useBookmarkSync } from '../src/hooks/useBookmarkSync';
import { useHistorySync } from '../src/hooks/useHistorySync';
import { useVisitSync } from '../src/hooks/useVisitSync';
import { useBookmarkAudioSync } from '../src/hooks/useBookmarkAudioSync';
import { useForceUpdate } from '../src/hooks/useForceUpdate';
import { ForceUpdateGate } from '../src/components/common/ForceUpdateGate';
import { navigateToNotification } from '../src/utils/notificationDeepLink';
import * as Notifications from 'expo-notifications';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import { syncSubscription } from '@/src/lib/subscription';
import {
	restorePendingReconciliation,
	settlePendingIfConfirmed,
} from '@/src/lib/purchaseReconciliation';
import { loadLastOnlineVerifiedAt, markOnlineVerifiedAt } from '@/src/lib/subscriptionVerification';
import { usePurchaseTransactionStore } from '@/src/store/purchaseTransactionStore';
import { usePurchaseLockStore } from '@/src/store/purchaseLockStore';
import { PurchaseLockOverlay } from '@/src/components/settings/PurchaseLockOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TTS_CACHE_PROBE_RUN_KEY, runTtsCacheProbe } from '../src/utils/runTtsCacheProbe';
import { Observe, ObserveRoot } from 'expo-observe';
import { supabase } from '@/src/utils/supabase';

// 렌더링 중 처리되지 않은 예외를 흰 화면/크래시 대신 이 화면으로 잡는다 (웹의 500 페이지에 해당).
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<Screen variant="warm">
			<Result
				icon="ice-cream-outline"
				title="문제가 발생했어요"
				description={'화면을 불러오지 못했어요. 다시 시도해 주세요.'}
				actionLabel="다시 시도하기"
				onAction={retry}
			/>
		</Screen>
	);
}

SplashScreen.preventAutoHideAsync();

Sentry.init({
	dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
	enabled: !isRunningInExpoGo(),
	// 사용자 IP 등 PII는 보내지 않고, 운영 트레이스는 비용을 고려해 20%만 수집한다.
	sendDefaultPii: false,
	tracesSampleRate: __DEV__ ? 1.0 : 0.2,
});

Observe.configure({
	integrations: { 'expo-router': true },
});

const queryClient = new QueryClient();

function BootSplash() {
	return (
		<View className="flex-1 items-center justify-center bg-gray100">
			<Image
				source={require('../assets/images/logo/logo.png')}
				className="h-[180px] w-[180px]"
				contentFit="contain"
			/>
		</View>
	);
}

function RootLayout() {
	const [fontsLoaded] = useFonts({
		'Pretendard-Light': require('../assets/fonts/Pretendard-Light.otf'),
		'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
		'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
		'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
		'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
		CormorantGaramond_400Regular,
		CormorantGaramond_400Regular_Italic,
		CormorantGaramond_600SemiBold,
		CormorantGaramond_700Bold,
		Hahmlet_400Regular,
		Hahmlet_600SemiBold,
		Hahmlet_700Bold,
		NanumPenScript_400Regular,
	});

	useEffect(() => {
		const initializePurchases = async () => {
			// USR-05: 강제 종료 등으로 남은 표식을 메모리로 복원한다. 해제는 아래 재조회가
			// "표식 이후 구매된 active entitlement"를 확인했을 때만 한다(D9 — inactive로는 해제하지 않음).
			const restoredGeneration = await restorePendingReconciliation();
			try {
				const lastOnlineVerifiedAt = await loadLastOnlineVerifiedAt();
				useSubscriptionStore.getState().setLastOnlineVerifiedAt(lastOnlineVerifiedAt);

				const revenueCatApiKey = __DEV__
					? process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY
					: Platform.OS === 'ios'
						? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
						: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

				if (!revenueCatApiKey) {
					throw new Error(`RevenueCat API key is missing for ${Platform.OS}`);
				}

				Purchases.configure({ apiKey: revenueCatApiKey });

				await Purchases.invalidateCustomerInfoCache();
				const customerInfo = await Purchases.getCustomerInfo();
				const verifiedAt = await markOnlineVerifiedAt();
				if (verifiedAt) {
					syncSubscription(customerInfo, { onlineVerifiedAt: verifiedAt, allowUnverified: false });
				}
				if (restoredGeneration !== null) {
					await settlePendingIfConfirmed(customerInfo, restoredGeneration);
				}
			} catch (error) {
				console.error('RevenueCat 초기화 실패:', error);
			} finally {
				useSubscriptionStore.getState().setSubscriptionLoading(false);
			}
		};

		void initializePurchases();

		// USR-05 D9: 조기 inactive 뒤 늦게 도착한 승인도 pending을 해제할 수 있게 리스너에서도 같은 규칙을 적용한다.
		const handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
			syncSubscription(customerInfo);
			void settlePendingIfConfirmed(
				customerInfo,
				usePurchaseTransactionStore.getState().generation,
			);
		};
		Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

		// NET-04: Apple 승인 직후 RevenueCat 서버만 일시적으로 끊겼다가 복구될 수 있다.
		// foreground 복귀 때 CustomerInfo를 다시 읽어 Offline Entitlements 또는 서버 동기화
		// 결과를 반영한다. 구매를 재호출하지 않고 읽기 작업만 수행한다.
		const appStateSubscription = AppState.addEventListener('change', (nextState) => {
			if (nextState !== 'active') return;
			// 결제 시트가 닫힐 때도 active 전환이 온다 — 조회 도중 새 구매가 시작되면 해제하지 않도록 기준값을 잡는다(D8).
			const expectedGeneration = usePurchaseTransactionStore.getState().generation;
			void (async () => {
				try {
					await Purchases.invalidateCustomerInfoCache();
					const customerInfo = await Purchases.getCustomerInfo();
					const verifiedAt = await markOnlineVerifiedAt();
					if (verifiedAt)
						syncSubscription(customerInfo, {
							onlineVerifiedAt: verifiedAt,
							allowUnverified: false,
						});
					// USR-05 D3/D8: 포그라운드 복귀만으로 entitlement가 확정될 수 있으므로 표식을 정리하되,
					// 진행 중 구매·조회 중 시작된 구매·표식 이전에 구매된 entitlement로는 지우지 않는다.
					await settlePendingIfConfirmed(customerInfo, expectedGeneration);
				} catch (error) {
					console.error('RevenueCat foreground 상태 확인 실패:', error);
				}
			})();
		});

		return () => {
			Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
			appStateSubscription.remove();
		};
	}, []);

	const { authLoading, user, onboardingCompleted } = useAuthStore(
		useShallow((s) => ({
			authLoading: s.isLoading,
			user: s.user,
			onboardingCompleted: s.onboardingCompleted,
		})),
	);

	// RevenueCat entitlement와 별도로, 운영자가 profiles에서 부여한 premium flag도 동기화한다.
	// 조회 실패 시 기존 RevenueCat 상태를 유지해 네트워크 오류가 권한을 갑자기 회수하지 않게 한다.
	useEffect(() => {
		let cancelled = false;
		const loadProfilePremium = async () => {
			useSubscriptionStore.getState().setProfilePremium(false);
			if (!user?.id) return;

			const { data, error } = await supabase
				.from('profiles')
				.select('is_premium')
				.eq('id', user.id)
				.maybeSingle();

			if (cancelled || error) {
				if (error) console.error('프로필 premium 상태 조회 실패:', error);
				return;
			}
			useSubscriptionStore.getState().setProfilePremium(data?.is_premium === true);
		};

		void loadProfilePremium();
		return () => {
			cancelled = true;
		};
	}, [user?.id]);
	const { blocked: forceUpdateBlocked, storeUrl: forceUpdateStoreUrl } = useForceUpdate();
	usePushNotifications(user?.id);
	useBookmarkSync(); // 로그인 시 Supabase 북마크 동기화
	useHistorySync(); // 로그인 시 Supabase 오디오 가이드 히스토리 동기화
	useVisitSync(); // 로그인 시 Supabase 관람 기록 동기화
	useBookmarkAudioSync(); // 로그인 시 Supabase 오디오 북마크 동기화

	const { hasHydrated, isImmersive, immersiveExhibitionId, immersiveExhibitionTitle } =
		useImmersiveStore(
			useShallow((s) => ({
				hasHydrated: s._hasHydrated,
				isImmersive: s.isImmersiveMode,
				immersiveExhibitionId: s.exhibitionId,
				immersiveExhibitionTitle: s.exhibitionTitle,
			})),
		);
	const isPurchaseLocked = usePurchaseLockStore((s) => s.isLocked);
	const router = useRouter();
	const segments = useSegments();
	const onPlaylist = segments.includes('playlist');
	const didRestoreImmersiveRef = useRef(false);
	const [bootCovered, setBootCovered] = useState(true);

	const revealBoot = () => {
		setBootCovered(false);
		void SplashScreen.hideAsync();
	};

	// 알림 탭 딥링크 처리
	useEffect(() => {
		let sub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener>;
		try {
			sub = Notifications.addNotificationResponseReceivedListener((response) => {
				const data = response.notification.request.content.data as Record<string, unknown>;
				void navigateToNotification(router, data);
			});
		} catch {
			// 네이티브 모듈 미빌드 환경에서 무시
		}
		return () => sub?.remove();
	}, [router]);

	// 지도 탭 마커 이미지를 앱 시작 시점에 미리 캐싱 — 미리 로드하지 않으면 지도 진입 직후
	// 첫 마커가 잠깐 네이버 지도 SDK 기본(초록) 핀으로 보였다가 커스텀 이미지로 바뀐다.
	useEffect(() => {
		Asset.fromModule(require('../assets/images/skulpture/marker-badge.png'))
			.downloadAsync()
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!__DEV__ || !fontsLoaded || authLoading) return;
		void AsyncStorage.getItem(TTS_CACHE_PROBE_RUN_KEY).then((flag) => {
			if (flag === '1' || flag === '2') void runTtsCacheProbe();
		});
	}, [fontsLoaded, authLoading]);

	useEffect(() => {
		if (!fontsLoaded || !hasHydrated) return;

		// 몰입 세션은 AsyncStorage에 있다. auth를 기다리면 (tabs)가 먼저 그려지므로
		// hydrate가 끝나는 즉시 playlist로 replace하고, 실제로 도착할 때까지 커버를 유지한다.
		if (isImmersive && bootCovered) {
			if (!onPlaylist) {
				router.replace('/(guide)/playlist');
				if (!didRestoreImmersiveRef.current) {
					didRestoreImmersiveRef.current = true;
					useArtistIntroStore
						.getState()
						.prepare(immersiveExhibitionId, immersiveExhibitionTitle ?? undefined);
				}
				return;
			}
			revealBoot();
			return;
		}

		if (authLoading) return;

		// 로그인은 됐지만 온보딩 미완료 → 온보딩으로 보낸다
		// (앱 종료 후 재시작, 또는 온보딩 중 앱을 끈 경우)
		if (user && onboardingCompleted === false) {
			router.replace('/onboarding');
			revealBoot();
			return;
		}

		revealBoot();
		// 부트스트랩 시점에만 분기한다. isImmersive/router를 deps에 넣으면
		// 이후 몰입 모드 진입마다 루트에서 playlist로 다시 이동한다.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		fontsLoaded,
		hasHydrated,
		isImmersive,
		bootCovered,
		onPlaylist,
		authLoading,
		user,
		onboardingCompleted,
	]);

	if (!fontsLoaded) return <BootSplash />;

	if (forceUpdateBlocked) {
		SplashScreen.hideAsync();
		return <ForceUpdateGate storeUrl={forceUpdateStoreUrl} />;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<AuthProvider>
				<QueryClientProvider client={queryClient}>
					<ToastProvider>
						<BottomSheetModalProvider>
							<Stack screenOptions={{ headerShown: false, gestureEnabled: !isPurchaseLocked }}>
								<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
								<Stack.Screen
									name="(guide)"
									options={{
										headerShown: false,
										gestureEnabled: !isImmersive,
										animation: bootCovered ? 'none' : 'default',
									}}
								/>
								<Stack.Screen name="(explore)" options={{ headerShown: false }} />
								<Stack.Screen name="auth" options={{ headerShown: false }} />
								<Stack.Screen name="diary/[date]" options={{ headerShown: false }} />
								<Stack.Screen name="diary/verify-ticket" options={{ headerShown: false }} />
								<Stack.Screen name="diary/confirm-visits" options={{ headerShown: false }} />
								<Stack.Screen
									name="onboarding"
									options={{ headerShown: false, gestureEnabled: false }}
								/>
								<Stack.Screen name="settings" options={{ headerShown: false }} />
								<Stack.Screen name="bookmark" options={{ headerShown: false }} />
								<Stack.Screen name="notifications" options={{ headerShown: false }} />
								<Stack.Screen
									name="search"
									options={{ headerShown: false, animation: 'fade', animationDuration: 130 }}
								/>
							</Stack>
							<PurchaseLockOverlay />
							{bootCovered ? (
								<View className="absolute inset-0 z-50">
									<BootSplash />
								</View>
							) : null}
						</BottomSheetModalProvider>
					</ToastProvider>
				</QueryClientProvider>
			</AuthProvider>
		</GestureHandlerRootView>
	);
}

export default Sentry.wrap(ObserveRoot.wrap(RootLayout));
