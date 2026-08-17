import { Stack } from 'expo-router';

export default function SettingsLayout() {
	return (
		<Stack>
			<Stack.Screen name='index' options={{ headerShown: false }} />
			<Stack.Screen name='voice' options={{ headerShown: false }} />
			<Stack.Screen name='account' options={{ headerShown: false }} />
			<Stack.Screen name='inquiry' options={{ headerShown: false }} />
			<Stack.Screen name='delete-account' options={{ headerShown: false }} />
			<Stack.Screen name='bookmark/exhibition' options={{ headerShown: false }} />
			<Stack.Screen name='bookmark/audio' options={{ headerShown: false }} />
		</Stack>
	);
}
