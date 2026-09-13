import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, NarrationSettingsFields, SettingsCard } from '@/src/components/mypage';
import { APP_VERSION, SCRAP_TILES } from '@/src/data/mypage';
import { colors } from '@/src/constants/colors';
import { useSettingsStore } from '@/src/store/settingsStore';

export default function MyPageScreen() {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);
	const authLoading = useAuthStore((s) => s.isLoading);
	const signOut = useAuthStore((s) => s.signOut);
	const [signingOut, setSigningOut] = useState(false);
	const { pushNotificationsEnabled, setPushNotificationsEnabled, highContrast, setHighContrast } =
		useSettingsStore();

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

	if (authLoading) return <ActivityIndicator style={{ flex: 1 }} />;

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>마이페이지</Screen.Header.Center>
				{session && (
					<Screen.Header.Right>
						<Pressable
							onPress={signingOut ? undefined : handleSignOut}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="로그아웃"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							{signingOut ? (
								<ActivityIndicator size="small" color={colors.gray600} />
							) : (
								<Ionicons name="log-out-outline" size={22} className="text-error" />
							)}
						</Pressable>
					</Screen.Header.Right>
				)}
			</Screen.Header>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-[60px]" scrollEnabled={!!session}>
				<View className="w-full">
					{/* 로그인 유도 */}
					{!session && (
						<View>
							<Pressable
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									router.push({ pathname: '/auth/login', params: { returnTo: '/settings' } });
								}}
								accessibilityRole="button"
								accessibilityLabel="로그인하기"
								className="mt-4"
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							>
								<Text className="font-pretendard-bold text-gray900 text-[18px] mb-1.5">
									로그인하고 더 많은 기능을 만나보세요
								</Text>
								<Text className="font-pretendard-regular text-gray600 text-[13px] leading-[19px] mb-4">
									{`몰입모드, 나만의 해설 생성, 취향 기반 추천까지\n로그인하면 모두 이용할 수 있어요`}
								</Text>
								<View className="self-start rounded-full bg-secondary px-5 py-2.5">
									<Text className="font-pretendard-semibold text-white text-[13px]">
										로그인하기
									</Text>
								</View>
							</Pressable>
							<View className="h-2.5 bg-bg-tonal mt-8" style={{ marginHorizontal: -24 }} />
						</View>
					)}

					{session && (
						<>
						<View>
							<SettingsCard>
								<CardRow label="내 정보" onPress={() => router.push('/settings/account')} />
								<CardRow
									label="내 취향 수정"
									onPress={() => router.push('/settings/preferences')}
								/>
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
						<View className="h-[1px] w-full bg-gray500/30 my-4" /></>
					)}

					

					<View className={session ? "mt-0" : 'mt-4'}>
						<SettingsCard>
							{(session ? SCRAP_TILES : SCRAP_TILES.slice(0, 1)).map((tile) => (
								<CardRow
									key={tile.key}
									label={tile.label}
									onPress={() => router.push(tile.route)}
								/>
							))}
						</SettingsCard>
					</View>

					<View className="h-[1px] w-full bg-gray500/30 my-4" />

					{session && (
						<>
						<NarrationSettingsFields />

							<View className="h-[1px] w-full bg-gray500/30 my-4" />
						</>
					)}

					<View className="relative">
						<SettingsCard>
							<CardRow label="푸시 알림" className="py-3">
								<Switch
									value={pushNotificationsEnabled}
									onValueChange={setPushNotificationsEnabled}
									trackColor={{ false: colors.border, true: colors.gray900 }}
									thumbColor="#FFFFFF"
									ios_backgroundColor={colors.border}
									style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
									className="absolute -right-1 top-2"
								/>
							</CardRow>
						</SettingsCard>
					</View>

					<View className="h-[1px] w-full bg-gray500/30 my-4" />

					<View>
						<SettingsCard>
							<CardRow label="공지사항" onPress={() => router.push('/settings/notice')} />
							<CardRow label="의견 보내기" onPress={() => router.push('/settings/inquiry')} />
							<CardRow label="별점 남기기" onPress={() => {}} />
						</SettingsCard>
					</View>

					<View className="h-[1px] w-full bg-gray500/30 my-4" />

					<View>
						<SettingsCard>
							<CardRow label="서비스 이용약관" onPress={() => router.push('/terms')} />
							<CardRow label="개인정보 처리방침" onPress={() => router.push('/privacy-policy')} />
							<CardRow label="버전" value={APP_VERSION} />
						</SettingsCard>
					</View>

				</View>
			</ScrollView>
		</Screen>
	);
}
