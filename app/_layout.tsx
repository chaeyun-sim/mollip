import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '../global.css';

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
import { useFonts } from 'expo-font';
import { useRouter, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useImmersiveStore } from '../src/store/immersiveStore';

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
	});

	const hasHydrated = useImmersiveStore((s) => s._hasHydrated);
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const exhibitionId = useImmersiveStore((s) => s.exhibitionId);
	const router = useRouter();

	useEffect(() => {
		if (!fontsLoaded || !hasHydrated) return;
		// 몰입 모드 복원이 있으면 replace 먼저, 그다음 스플래시 해제
		// → 스플래시가 가리는 동안 이동 완료되어 플래시 없음
		if (isImmersive && exhibitionId) {
			router.push(`/(guide)/immersive/${exhibitionId}`);
		}
		SplashScreen.hideAsync();
	}, [fontsLoaded, hasHydrated]);

	if (!fontsLoaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<QueryClientProvider client={queryClient}>
				<BottomSheetModalProvider>
					<Stack>
						<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
						<Stack.Screen name='(guide)' options={{ headerShown: false }} />
						<Stack.Screen name='(explore)' options={{ headerShown: false }} />
						<Stack.Screen name='settings' options={{ headerShown: false }} />
						<Stack.Screen name='onboarding' options={{ headerShown: false }} />
					</Stack>
				</BottomSheetModalProvider>
			</QueryClientProvider>
		</GestureHandlerRootView>
	);
}
