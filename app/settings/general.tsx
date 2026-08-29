import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { useSettingsStore } from '@/src/store/settingsStore';
import { colors } from '@/src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function GeneralSettingsScreen() {
	const router = useRouter();
	const signOut = useAuthStore((s) => s.signOut);
	const [signingOut, setSigningOut] = useState(false);
	const { highContrast, setHighContrast } = useSettingsStore();

	const handleSignOut = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setSigningOut(true);
		try {
			await signOut();
			router.replace('/(tabs)');
		} catch {
			setSigningOut(false);
		}
	};

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>설정</Screen.Header.Center>
			</Screen.Header>

			<View className="w-full mt-2">
				{/* 계정 */}
				<View className="gap-2">
					<SettingsCard>
						<CardRow label="내 정보" onPress={() => router.push('/settings/account')} />
						<CardRow label="내 취향 수정" onPress={() => router.push('/settings/preferences')} />
						<CardRow label="고대비 모드">
							<Switch
								value={highContrast}
								onValueChange={setHighContrast}
								trackColor={{ false: colors.border, true: colors.gray900 }}
								thumbColor="#FFFFFF"
								ios_backgroundColor={colors.border}
								style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
								className="absolute -right-1 top-2"
							/>
						</CardRow>
					</SettingsCard>
				</View>

				<View className="h-[1px] w-full bg-gray500/30 my-3" />

				{/* 앱 정보 */}
				<View className="gap-2 mt-1">
					<SettingsCard>
						<CardRow label="서비스 이용약관" onPress={() => router.push('/terms')} />
						<CardRow label="개인정보 처리방침" onPress={() => router.push('/privacy-policy')} />
					</SettingsCard>
				</View>

				<View className="h-[1px] w-full bg-gray500/30 my-3" />

				{/* 계정 관리 */}
				<View className="gap-2">
					<SettingsCard>
						{signingOut ? (
							<ActivityIndicator size="small" color={colors.gray600} />
						) : (
							<Pressable
								onPress={signingOut ? undefined : handleSignOut}
								accessibilityRole="button"
								accessibilityLabel="로그아웃"
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								className="flex-row items-center gap-2 h-[44px] border-[rgba(28,25,23,0.06)]"
							>
								<Ionicons name="log-out-outline" size={16} className="text-error" />
								<Text className="font-pretendard-medium text-error text-[13px]">로그아웃</Text>
							</Pressable>
						)}
					</SettingsCard>
				</View>
			</View>
		</Screen>
	);
}
