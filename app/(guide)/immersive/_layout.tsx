import { Stack } from 'expo-router';

export default function ImmersiveLayout() {
	return <Stack screenOptions={{ headerShown: false }} />;
}
