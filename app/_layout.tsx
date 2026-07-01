import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
	const [loaded] = useFonts({
		'Pretendard-Light': require('../assets/fonts/Pretendard-Light.otf'),
		'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
		'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
		'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
		'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
	});

	useEffect(() => {
		if (loaded) SplashScreen.hideAsync();
	}, [loaded]);

	if (!loaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<QueryClientProvider client={queryClient}>
				<BottomSheetModalProvider>
					<Stack>
						<Stack.Screen name='index' options={{ headerShown: false }} />
						<Stack.Screen name='create-description' options={{ headerShown: false }} />
						<Stack.Screen name='manual' options={{ headerShown: false }} />
						<Stack.Screen name='description' options={{ headerShown: false }} />
						<Stack.Screen name='chat' options={{ headerShown: false }} />
						<Stack.Screen name='settings' options={{ headerShown: false }} />
					</Stack>
				</BottomSheetModalProvider>
			</QueryClientProvider>
		</GestureHandlerRootView>
	);
}
