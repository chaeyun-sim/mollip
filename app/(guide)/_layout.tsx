import { Stack } from 'expo-router';

export default function GuideLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="create-description"
				options={{ headerShown: false, gestureEnabled: false }}
			/>
		</Stack>
	);
}
