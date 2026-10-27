import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ScreenHeader } from '../layout/ScreenHeader';
import { LoginRequiredPressable } from '../auth/LoginRequiredPressable';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface CommonHeaderProps {
	fullBleed?: boolean;
}

export function CommonHeader({ fullBleed = false }: CommonHeaderProps) {
	const { t } = useTranslation();

	return (
		<ScreenHeader fullBleed={fullBleed}>
			<ScreenHeader.Left>
				<ScreenHeader.Logo />
			</ScreenHeader.Left>
			<ScreenHeader.Right>
				<View className="flex-row items-center gap-4">
					<LoginRequiredPressable
						onPress={() => router.push('/bookmark')}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel={t('exhibitions.bookmark')}
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						returnTo="/bookmark"
					>
						<Ionicons name="bookmark-outline" size={24} className="text-gray900" />
					</LoginRequiredPressable>
					<LoginRequiredPressable
						onPress={() => router.push('/notifications')}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel={t('diary.notifications_a11y')}
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						returnTo="/notifications"
					>
						<Ionicons name="notifications-outline" size={24} className="text-gray900" />
					</LoginRequiredPressable>
				</View>
			</ScreenHeader.Right>
		</ScreenHeader>
	);
}
