import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '../global.css';
import '../src/lib/iconInterop';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { useRouter, Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useShallow } from 'zustand/react/shallow';
import { Result } from '../src/components/common/Result';
import { Screen } from '../src/components/layout/Screen';
import { useImmersiveStore } from '../src/store/immersiveStore';
import { AuthProvider } from '../src/providers/AuthProvider';
import { ToastProvider } from '../src/providers/ToastProvider';
import { useAuthStore } from '../src/store/authStore';
// import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useBookmarkSync } from '../src/hooks/useBookmarkSync';
import { useHistorySync } from '../src/hooks/useHistorySync';
import { useVisitSync } from '../src/hooks/useVisitSync';
import { useBookmarkAudioSync } from '../src/hooks/useBookmarkAudioSync';
// import * as Notifications from 'expo-notifications';

// 렌더링 중 처리되지 않은 예외를 흰 화면/크래시 대신 이 화면으로 잡는다 (웹의 500 페이지에 해당).
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
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

export default function RootLayout() {
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

	const { authLoading, user, onboardingCompleted } = useAuthStore(
		useShallow((s) => ({
			authLoading: s.isLoading,
			user: s.user,
			onboardingCompleted: s.onboardingCompleted,
		})),
	);
	// usePushNotifications(user?.id); // 네이티브 빌드 후 활성화
	useBookmarkSync(); // 로그인 시 Supabase 북마크 동기화
	useHistorySync(); // 로그인 시 Supabase 오디오 가이드 히스토리 동기화
	useVisitSync(); // 로그인 시 Supabase 관람 기록 동기화
	useBookmarkAudioSync(); // 로그인 시 Supabase 오디오 북마크 동기화

	const { hasHydrated, isImmersive } = useImmersiveStore(
		useShallow((s) => ({ hasHydrated: s._hasHydrated, isImmersive: s.isImmersiveMode })),
	);
	const router = useRouter();

	// 알림 탭 딥링크 처리
	// useEffect(() => {
	// 	let sub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener>;
	// 	try {
	// 		sub = Notifications.addNotificationResponseReceivedListener((response) => {
	// 			const data = response.notification.request.content.data as Record<string, unknown>;
	// 			const id = data?.exhibitionId;
	// 			if (typeof id === 'string' && id) {
	// 				router.push(`/(explore)/${id}`);
	// 			} else {
	// 				router.push('/(tabs)/');
	// 			}
	// 		});
	// 	} catch {
	// 		// 네이티브 모듈 미빌드 환경에서 무시
	// 	}
	// 	return () => sub?.remove();
	// }, [router]);

	// 지도 탭 마커 이미지를 앱 시작 시점에 미리 캐싱 — 미리 로드하지 않으면 지도 진입 직후
	// 첫 마커가 잠깐 네이버 지도 SDK 기본(초록) 핀으로 보였다가 커스텀 이미지로 바뀐다.
	useEffect(() => {
		Asset.fromModule(require('../assets/images/skulpture/marker-badge.png'))
			.downloadAsync()
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!fontsLoaded || authLoading) return;

		// 로그인은 됐지만 온보딩 미완료 → 온보딩으로 보낸다
		// (앱 종료 후 재시작, 또는 온보딩 중 앱을 끈 경우)
		if (user && onboardingCompleted === false) {
			router.replace('/onboarding');
			SplashScreen.hideAsync();
			return;
		}

		// 몰입 모드 복원 — 이미 isImmersiveMode가 true이므로 몰입 모드 홈(playlist)으로 바로 진입
		if (hasHydrated && isImmersive) {
			router.push('/(guide)/playlist');
		}
		SplashScreen.hideAsync();
		// 부트스트랩 시점에만 분기한다. isImmersive/router를 deps에 넣으면
		// 이후 몰입 모드 진입마다 루트에서 playlist로 다시 push된다.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fontsLoaded, hasHydrated, authLoading, user, onboardingCompleted]);

	if (!fontsLoaded) return <BootSplash />;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<AuthProvider>
				<QueryClientProvider client={queryClient}>
					<BottomSheetModalProvider>
						<ToastProvider>
							<Stack screenOptions={{ headerShown: false }}>
								<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
								<Stack.Screen
									name="(guide)"
									options={{ headerShown: false, gestureEnabled: !isImmersive }}
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
							</Stack>
						</ToastProvider>
					</BottomSheetModalProvider>
				</QueryClientProvider>
			</AuthProvider>
		</GestureHandlerRootView>
	);
}
