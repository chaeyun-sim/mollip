import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { APP_VERSION } from '@/src/data/mypage';
import { useSubscription } from '@/src/hooks/useSubscription';
import { useAuthStore } from '@/src/store/authStore';
import { cn } from '@/src/lib/cn';
import { formatSubscriptionDate } from '@/src/lib/subscription';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import { CommonHeader } from '@/src/components/common/CommonHeader';
import { openLegalDocument } from '@/src/utils/openLegalDocument';

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
	const { isPremium, isLoading: isSubscriptionLoading } = useSubscription();
	const { expirationDate, billingIssueDetectedAt } = useSubscriptionStore(
		useShallow((s) => ({
			expirationDate: s.expirationDate,
			billingIssueDetectedAt: s.billingIssueDetectedAt,
		})),
	);

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

	const showUpgrade = !isSubscriptionLoading && !isPremium;
	// 결제 문제가 있으면 행에서 바로 보이게 — 없으면 만료일, 만료일도 모르면 이용 중 표시
	const getSubscriptionValue = () => {
		if (billingIssueDetectedAt) return '결제 확인 필요';
		if (expirationDate) return `${formatSubscriptionDate(expirationDate)}까지`;
		return 'Premium';
	};
	const subscriptionValue = getSubscriptionValue();

	if (authLoading) return <ActivityIndicator style={{ flex: 1 }} />;

	return (
		<Screen variant="warm" className={session ? 'px-6' : 'px-0'}>
			<CommonHeader />

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName={cn('pb-10', session ? 'px-0' : 'px-6')}
			>
				<View className="w-full gap-6">
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
						</>
					)}

					{session && user && (
						<>
							<Pressable
								onPress={() => router.push('/settings/account')}
								accessibilityRole="button"
								accessibilityLabel="계정 정보"
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								className="flex-row items-center gap-3.5 mt-3 rounded-2xl bg-brand px-4 py-3.5 shadow-gray900 elevation-[2px]"
							>
								<View className="w-10 h-10 rounded-full bg-brand-on-dark items-center justify-center">
									<Text className="font-pretendard-semibold text-ink text-[18px]">
										{user?.email?.charAt(0).toUpperCase()}
									</Text>
								</View>
								<View className="flex-1">
									<Text className="font-pretendard-semibold text-white text-[17px]">
										{isPremium
											? `✨${user?.email?.split('@')[0]}님✨`
											: `${user?.email?.split('@')[0]}님`}
									</Text>
								</View>
								<Ionicons name="chevron-forward" size={18} className="text-white" />
							</Pressable>

							{/* 프리미엄 이용자는 배너 대신 아래 '구독 관리' 행으로 — 업그레이드 안내만 비구독자에게 */}
							{showUpgrade && (
								<Pressable
									onPress={() => router.push('/settings/premium')}
									accessibilityRole="button"
									accessibilityLabel="프리미엄 이용권 보기"
									className="flex-row items-center gap-3.5 rounded-2xl bg-secondary px-4 py-4"
								>
									<Ionicons name="sparkles" size={20} className="text-brand" />
									<View className="flex-1">
										<Text className="font-pretendard-bold text-white text-[15px] mb-0.5">
											프리미엄으로 업그레이드
										</Text>
										<Text className="font-pretendard-regular text-white/70 text-[12px] leading-[17px]">
											무제한 몰입모드와 나만의 해설을 만나보세요
										</Text>
									</View>
									<Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
								</Pressable>
							)}

							{session && (
								<View>
									<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
										계정 관리
									</Text>
									<SettingsCard>
										{isPremium && (
											<CardRow
												icon="card-outline"
												label="구독 관리"
												value={subscriptionValue}
												onPress={() => router.push('/settings/subscribe')}
											/>
										)}
										<CardRow
											icon="color-palette-outline"
											label="내 취향 수정"
											onPress={() => router.push('/settings/preferences')}
										/>
									</SettingsCard>
								</View>
							)}

							<View>
								<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
									해설
								</Text>
								<SettingsCard locked={!isPremium}>
									<CardRow
										icon="headset-outline"
										label="해설 설정"
										onPress={() => router.push('/settings/narration')}
										disabled={!isPremium}
									/>
								</SettingsCard>
							</View>
						</>
					)}

					<View>
						<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
							서비스
						</Text>
						<SettingsCard>
							<CardRow
								icon="megaphone-outline"
								label="공지사항"
								onPress={() => router.push('/settings/notice')}
							/>
							<CardRow
								icon="chatbubble-ellipses-outline"
								label="의견 보내기"
								onPress={() => router.push('/settings/inquiry')}
							/>
							<CardRow icon="star-outline" label="별점 남기기" onPress={() => {}} />
						</SettingsCard>
					</View>

					<View>
						<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
							앱 정보
						</Text>
						<SettingsCard>
							<CardRow
								icon="document-text-outline"
								label="서비스 이용약관"
								onPress={() => void openLegalDocument('terms')}
							/>
							<CardRow
								icon="shield-checkmark-outline"
								label="개인정보 처리방침"
								onPress={() => void openLegalDocument('privacy')}
							/>
							<CardRow
								icon="code-slash-outline"
								label="오픈소스 라이선스"
								onPress={() => router.push('/settings/open-source-licenses')}
							/>
							<CardRow icon="information-circle-outline" label="버전" value={APP_VERSION} />
						</SettingsCard>
					</View>

					{session && (
						<Pressable
							onPress={signingOut ? undefined : handleSignOut}
							accessibilityRole="button"
							accessibilityLabel="로그아웃"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							className="h-14 items-center justify-center"
						>
							{signingOut ? (
								<ActivityIndicator size="small" className="text-gray600" />
							) : (
								<Text className="font-pretendard-medium text-error text-[15px]">로그아웃</Text>
							)}
						</Pressable>
					)}
				</View>
			</ScrollView>
		</Screen>
	);
}
