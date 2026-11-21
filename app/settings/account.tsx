import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { useAuthStore } from '@/src/store/authStore';

export default function AccountScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);

	const handleDeleteAccoun = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setShowWithdrawWarning(true);
	};

	if (!user) return null;

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={() => router.back()} />
				<Screen.Header.Center>{t('account.title')}</Screen.Header.Center>
			</Screen.Header>

			<View className="flex-1 mt-5 gap-4">
				{user.email && (
					<SettingsCard>
						<CardRow icon="mail-outline" label={t('account.email')} value={user.email} />
						<CardRow
							icon="log-in-outline"
							label={t('account.login_method')}
							value={
								user.app_metadata.provider?.toUpperCase() === 'KAKAO'
									? t('account.login_kakao')
									: t('account.login_apple')
							}
						/>
					</SettingsCard>
				)}

				<SettingsCard>
					<Pressable
						onPress={showWithdrawWarning ? undefined : handleDeleteAccoun}
						accessibilityRole="button"
						accessibilityLabel={t('account.delete_a11y')}
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						className="flex-row items-center h-16"
					>
						<View className="w-8 h-8 rounded-full bg-error/10 items-center justify-center mr-3">
							<Ionicons name="person-remove-outline" size={16} className="text-error" />
						</View>
						<Text className="flex-1 font-pretendard-medium text-error text-base">
							{t('account.delete')}
						</Text>
						{showWithdrawWarning && <ActivityIndicator size="small" className="text-gray600" />}
					</Pressable>
				</SettingsCard>
			</View>

			<ConfirmDialog
				visible={showWithdrawWarning}
				title={t('account.confirm_title')}
				description={t('account.confirm_body')}
				cancelLabel={t('common.close')}
				confirmLabel={t('account.confirm_delete')}
				confirmTone="danger"
				onCancel={() => undefined}
				onConfirm={() => router.push('/settings/delete-account')}
				onDismiss={() => setShowWithdrawWarning(false)}
			/>
		</Screen>
	);
}
