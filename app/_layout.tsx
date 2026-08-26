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
import { useFonts } from 'expo-font';
import { useRouter, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useImmersiveStore } from '../src/store/immersiveStore';
import { useHistoryStore } from '../src/store/historyStore';
import { AuthProvider } from '../src/providers/AuthProvider';
import { useAuthStore } from '../src/store/authStore';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useBookmarkSync } from '../src/hooks/useBookmarkSync';
import { useHistorySync } from '../src/hooks/useHistorySync';
import { useVisitSync } from '../src/hooks/useVisitSync';
import { useBookmarkAudioSync } from '../src/hooks/useBookmarkAudioSync';
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

	const hasHydrated = useImmersiveStore((s) => s._hasHydrated);
	const authLoading = useAuthStore((s) => s.isLoading);
	const user = useAuthStore((s) => s.user);
	const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
	usePushNotifications(user?.id); // 네이티브 빌드 후 활성화
	useBookmarkSync(); // 로그인 시 Supabase 북마크 동기화
	useHistorySync(); // 로그인 시 Supabase 오디오 가이드 히스토리 동기화
	useVisitSync(); // 로그인 시 Supabase 관람 기록 동기화
	useBookmarkAudioSync(); // 로그인 시 Supabase 오디오 북마크 동기화

	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const router = useRouter();

	// 알림 탭 딥링크 처리
	useEffect(() => {
		let sub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener>;
		try {
			sub = Notifications.addNotificationResponseReceivedListener((response) => {
				const data = response.notification.request.content.data as Record<string, unknown>;
				const id = data?.exhibitionId;
				if (typeof id === 'string' && id) {
					router.push(`/(explore)/${id}`);
				} else {
					router.push('/(tabs)/');
				}
			});
		} catch {
			// 네이티브 모듈 미빌드 환경에서 무시
		}
		return () => sub?.remove();
	}, [router]);

	// wikidataImage.ts가 작가명 검증 없이 매칭하던 시절 저장된 오매칭 이미지 정리 (1회성)
	useEffect(() => {
		if (!hasHydrated) return;
		useHistoryStore.getState().clearUntrustedWikiImages();
	}, [hasHydrated]);

	useEffect(() => {
		if (!fontsLoaded || !hasHydrated || authLoading) return;

		// 로그인은 됐지만 온보딩 미완료 → 온보딩으로 보낸다
		// (앱 종료 후 재시작, 또는 온보딩 중 앱을 끈 경우)
		if (user && onboardingCompleted === false) {
			router.replace('/onboarding');
			SplashScreen.hideAsync();
			return;
		}

		// 몰입 모드 복원 — 이미 isImmersiveMode가 true이므로 몰입 모드 홈(playlist)으로 바로 진입
		if (isImmersive) {
			router.push('/(guide)/playlist');
		}
		SplashScreen.hideAsync();
	}, [fontsLoaded, hasHydrated, authLoading, user, onboardingCompleted]);

	if (!fontsLoaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<AuthProvider>
				<QueryClientProvider client={queryClient}>
					<BottomSheetModalProvider>
						<Stack screenOptions={{ headerShown: false }}>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen
								name="(guide)"
								options={{ headerShown: false, gestureEnabled: !isImmersive }}
							/>
							<Stack.Screen name="(explore)" options={{ headerShown: false }} />
							<Stack.Screen name="auth" options={{ headerShown: false }} />
							<Stack.Screen name="diary/[date]" options={{ headerShown: false }} />
							<Stack.Screen
								name="onboarding"
								options={{ headerShown: false, gestureEnabled: false }}
							/>
							<Stack.Screen
								name="onboarding/location"
								options={{ headerShown: false, gestureEnabled: false }}
							/>
							<Stack.Screen name="settings" options={{ headerShown: false }} />
						</Stack>
					</BottomSheetModalProvider>
				</QueryClientProvider>
			</AuthProvider>
		</GestureHandlerRootView>
	);
}
