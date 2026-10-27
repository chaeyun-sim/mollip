import { useTranslation } from 'react-i18next';
import { Screen } from '@/src/components/layout/Screen';
import { NarrationSettingsFields } from '@/src/components/mypage';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function NarrationSettingsScreen() {
	const { t } = useTranslation();

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>{t('settings.description')}</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>
			<View className="px-1">
				<NarrationSettingsFields />
			</View>
		</Screen>
	);
}
