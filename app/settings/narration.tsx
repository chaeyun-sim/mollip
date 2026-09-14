import { Screen } from '@/src/components/layout/Screen';
import { NarrationSettingsFields } from '@/src/components/mypage';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function NarrationSettingsScreen() {
	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>해설 설정</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>
			<View className="px-1">
				<NarrationSettingsFields />
			</View>
		</Screen>
	);
}
