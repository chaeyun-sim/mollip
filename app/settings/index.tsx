import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { colors } from '@/src/constants/colors';
import { APP_VERSION } from '@/src/data/mypage';
import { useAuthStore } from '@/src/store/authStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { cn } from '@/src/lib/cn';

export default function MyPageScreen() {
	const router = useRouter();
	const { session, user, authLoading, signOut } = useAuthStore(
		useShallow((s) => ({
			session: s.session,
			user: s.user,
			authLoading: s.isLoading,
			signOut: s.signOut,
		})),
	);
	const [signingOut, setSigningOut] = useState(false);
	const { pushNotificationsEnabled, setPushNotificationsEnabled } = useSettingsStore();

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
		<Screen variant="warm" className={session ? 'px-6' : 'px-0'}>
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
								<ActivityIndicator size="small" className="text-gray600" />
							) : (
								<Ionicons name="log-out-outline" size={22} className="text-error" />
							)}
						</Pressable>
					</Screen.Header.Right>
				)}
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName={cn('pb-[60px]', session ? 'px-0' : 'px-6')}
				scrollEnabled={!!session}
			>
				<View className="w-full">
					{/* 로그인 유도 */}
					{!session && (
						<>
							<View className="mt-4">
								<Text className="font-pretendard-bold text-gray900 text-[18px] mb-1.5">
									로그인하고 더 많은 기능을 만나보세요
								</Text>
								<Text className="font-pretendard-regular text-gray600 text-[13px] leading-[19px] mb-4">
									{`몰입모드, 나만의 해설 생성, 취향 기반 추천까지\n로그인하면 모두 이용할 수 있어요`}
								</Text>
								<Pressable
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										router.push({ pathname: '/auth/login', params: { returnTo: '/settings' } });
									}}
									accessibilityRole="button"
									accessibilityLabel="로그인하기"
									style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
									className="self-start rounded-full bg-secondary px-5 py-2.5"
								>
									<Text className="font-pretendard-semibold text-white text-[13px]">
										로그인하기
									</Text>
								</Pressable>
							</View>
							<View className="h-2.5 bg-bg-tonal mt-8" style={{ marginHorizontal: -24 }} />
						</>
					)}

					{session && user && (
						<>
							<View className="flex-row items-center gap-3.5 mt-3 mb-4 rounded-2xl border border-divider bg-white px-4 py-3.5">
								<View className="w-12 h-12 rounded-full bg-bg-tonal items-center justify-center">
									<Text className="font-pretendard-semibold text-gray900 text-[18px]">
										{user?.email?.charAt(0).toUpperCase()}
									</Text>
								</View>
								<View className="flex-1">
									<Text className="font-pretendard-semibold text-gray900 text-[17px]">
										{user?.email?.split('@')[0]}님
									</Text>
									<Text className="font-pretendard-regular text-gray500 text-[13px] mt-0.5">
										{user?.app_metadata?.provider === 'kakao' ? '카카오 계정' : 'Apple 계정'}
									</Text>
								</View>
							</View>
							<View>
								<SettingsCard>
									<CardRow
										label="내 취향 수정"
										description="작품을 선택하면 전시를 추천해요"
										onPress={() => router.push('/settings/preferences')}
									/>
									<CardRow
										label="해설 설정"
										description="작품 해설의 다양한 설정을 바꿀 수 있어요"
										onPress={() => router.push('/settings/narration')}
									/>
								</SettingsCard>
							</View>
							<View className="h-[1px] w-full bg-gray500/30 my-4" />
						</>
					)}

					<View className={cn('relative', session ? 'mt-0' : 'mt-4')}>
						<SettingsCard>
							<CardRow label="푸시 알림" description="관심 전시의 소식과 추천을 받아요">
								<Switch
									value={pushNotificationsEnabled}
									onValueChange={setPushNotificationsEnabled}
									trackColor={{ false: colors.border, true: colors.gray900 }}
									thumbColor="#FFFFFF"
									ios_backgroundColor={colors.border}
									style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
								/>
							</CardRow>
						</SettingsCard>
					</View>

					<View className="h-[1px] w-full bg-gray500/30 my-4" />

					<View>
						<SettingsCard>
							<CardRow
								label="공지사항"
								description="새 기능 소식을 확인해요"
								onPress={() => router.push('/settings/notice')}
							/>
							<CardRow
								label="의견 보내기"
								description="개선할 점을 알려주세요"
								onPress={() => router.push('/settings/inquiry')}
							/>
							<CardRow
								label="별점 남기기"
								description="앱스토어에서 몰립을 평가해 주세요"
								onPress={() => {}}
							/>
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

					{session && (
						<Pressable
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								router.push('/settings/delete-account');
							}}
							accessibilityRole="button"
							accessibilityLabel="탈퇴하기"
							className="mt-5"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Text className="font-pretendard-medium text-error text-[14px]">탈퇴하기</Text>
						</Pressable>
					)}
				</View>
			</ScrollView>
		</Screen>
	);
}
