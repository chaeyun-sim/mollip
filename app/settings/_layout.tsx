import { Stack } from 'expo-router';

export default function SettingsLayout() {
	return (
		<Stack>
			<Stack.Screen name="voice" options={{ headerShown: false }} />
			<Stack.Screen name="narration" options={{ headerShown: false }} />
			<Stack.Screen name="account" options={{ headerShown: false }} />
			<Stack.Screen name="premium" options={{ headerShown: false }} />
			<Stack.Screen name="inquiry" options={{ headerShown: false }} />
			<Stack.Screen name="delete-account" options={{ headerShown: false }} />
			<Stack.Screen name="bookmark/exhibition" options={{ headerShown: false }} />
			<Stack.Screen name="bookmark/audio" options={{ headerShown: false }} />
			<Stack.Screen name="description" options={{ headerShown: false }} />
			<Stack.Screen name="preferences" options={{ headerShown: false }} />
			<Stack.Screen name="notice/index" options={{ headerShown: false }} />
			<Stack.Screen name="notice/[id]" options={{ headerShown: false }} />
			<Stack.Screen name="subscribe" options={{ headerShown: false }} />
			<Stack.Screen name="open-source-licenses" options={{ headerShown: false }} />
		</Stack>
	);
}
