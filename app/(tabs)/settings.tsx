import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
import { openStoreReview } from '@/src/utils/openStoreReview';
import { supabase } from '@/src/utils/supabase';

export default function MyPageScreen() {
	const { t, i18n } = useTranslation();

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
	const [avatar, setAvatar] = useState<{ userId: string; url: string | null } | null>(null);
	const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
	const avatarUrl = avatar?.userId === user?.id ? avatar?.url : null;
	const secureAvatarUrl = avatarUrl?.replace(
		/^http:\/\/k\.kakaocdn\.net\//,
		'https://k.kakaocdn.net/',
	);

	useEffect(() => {
		if (!user?.id) return;
		let cancelled = false;
		setAvatarLoadFailed(false);
		void supabase
			.from('profiles')
			.select('avatar_url')
			.eq('id', user.id)
			.maybeSingle()
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) console.warn('[mypage] 아바타 조회 실패:', error);
				setAvatar({ userId: user.id, url: data?.avatar_url ?? null });
			});
		return () => {
			cancelled = true;
		};
	}, [user?.id]);
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
		if (billingIssueDetectedAt) return t('settings.billing_issue');
		if (expirationDate) {
			const locale = i18n.language === 'en' ? 'en-US' : 'ko-KR';
			return t('settings.expires_until', {
				date: formatSubscriptionDate(expirationDate, locale),
			});
		}
		return 'Premium';
	};
	const subscriptionValue = getSubscriptionValue();
	const displayName = t('settings.user_name', { name: user?.email?.split('@')[0] });

	if (authLoading) return <ActivityIndicator style={{ flex: 1 }} />;

	return (
		<Screen variant="warm" className={session ? 'px-6' : 'px-0'}>
			<CommonHeader fullBleed={!session} />

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
									{t('settings.login_prompt_title')}
								</Text>
								<Text className="font-pretendard-regular text-gray600 text-[13px] leading-[19px] mb-4">
									{t('settings.login_prompt_body')}
								</Text>
								<Pressable
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										router.push({ pathname: '/auth/login', params: { returnTo: '/settings' } });
									}}
									accessibilityRole="button"
									accessibilityLabel={t('auth.login')}
									style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
									className="self-start rounded-full bg-secondary px-5 py-2.5"
								>
									<Text className="font-pretendard-semibold text-white text-[13px]">
										{t('auth.login')}
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
								accessibilityLabel={t('settings.account_info_a11y')}
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								className="flex-row items-center gap-3.5 mt-3 rounded-2xl bg-brand px-4 py-3.5 shadow-gray900 elevation-[2px]"
							>
								<View className="w-10 h-10 rounded-full bg-brand-on-dark items-center justify-center overflow-hidden">
									{secureAvatarUrl && !avatarLoadFailed ? (
										<Image
											source={{ uri: secureAvatarUrl }}
											className="w-10 h-10"
											accessibilityLabel={t('settings.profile_photo_a11y')}
											onError={() => setAvatarLoadFailed(true)}
										/>
									) : (
										<Text className="font-pretendard-semibold text-ink text-[18px]">
											{user.email?.charAt(0).toUpperCase()}
										</Text>
									)}
								</View>
								<View className="flex-1">
									<Text className="font-pretendard-semibold text-white text-[17px]">
										{isPremium ? `✨${displayName}✨` : displayName}
									</Text>
								</View>
								<Ionicons name="chevron-forward" size={18} className="text-white" />
							</Pressable>

							{/* 프리미엄 이용자는 배너 대신 아래 '구독 관리' 행으로 — 업그레이드 안내만 비구독자에게 */}
							{showUpgrade && (
								<Pressable
									onPress={() => router.push('/settings/premium')}
									accessibilityRole="button"
									accessibilityLabel={t('settings.premium_view_a11y')}
									className="flex-row items-center gap-3.5 rounded-2xl bg-secondary px-4 py-4"
								>
									<Ionicons name="sparkles" size={20} className="text-brand" />
									<View className="flex-1">
										<Text className="font-pretendard-bold text-white text-[15px] mb-0.5">
											{t('settings.upgrade_title')}
										</Text>
										<Text className="font-pretendard-regular text-white/70 text-[12px] leading-[17px]">
											{t('settings.upgrade_body')}
										</Text>
									</View>
									<Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
								</Pressable>
							)}

							{session && (
								<View>
									<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
										{t('settings.section_account')}
									</Text>
									<SettingsCard>
										{isPremium && (
											<CardRow
												icon="card-outline"
												label={t('settings.manage_subscription')}
												value={subscriptionValue}
												onPress={() => router.push('/settings/subscribe')}
											/>
										)}
										<CardRow
											icon="color-palette-outline"
											label={t('settings.edit_preferences')}
											onPress={() => router.push('/settings/preferences')}
										/>
									</SettingsCard>
								</View>
							)}

							<View>
								<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
									{t('settings.section_guide')}
								</Text>
								<SettingsCard locked={!isPremium}>
									<CardRow
										icon="headset-outline"
										label={t('settings.description')}
										onPress={() => router.push('/settings/narration')}
										disabled={!isPremium}
									/>
								</SettingsCard>
							</View>
						</>
					)}

					<View>
						<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
							{t('settings.section_service')}
						</Text>
						<SettingsCard>
							<CardRow
								icon="megaphone-outline"
								label={t('settings.notice')}
								onPress={() => router.push('/settings/notice')}
							/>
							<CardRow
								icon="chatbubble-ellipses-outline"
								label={t('settings.send_feedback')}
								onPress={() => router.push('/settings/inquiry')}
							/>
							<CardRow
								icon="star-outline"
								label={t('settings.rate_app')}
								onPress={() => void openStoreReview()}
							/>
						</SettingsCard>
					</View>

					<View>
						<Text className="ml-1 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
							{t('settings.section_app_info')}
						</Text>
						<SettingsCard>
							<CardRow
								icon="document-text-outline"
								label={t('auth.terms_of_service')}
								onPress={() => void openLegalDocument('terms')}
							/>
							<CardRow
								icon="shield-checkmark-outline"
								label={t('auth.privacy_policy')}
								onPress={() => void openLegalDocument('privacy')}
							/>
							<CardRow
								icon="code-slash-outline"
								label={t('settings.open_source_licenses')}
								onPress={() => router.push('/settings/open-source-licenses')}
							/>
							<CardRow
								icon="information-circle-outline"
								label={t('settings.version')}
								value={APP_VERSION}
							/>
						</SettingsCard>
					</View>

					{session && (
						<Pressable
							onPress={signingOut ? undefined : handleSignOut}
							accessibilityRole="button"
							accessibilityLabel={t('auth.logout')}
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							className="h-14 items-center justify-center"
						>
							{signingOut ? (
								<ActivityIndicator size="small" className="text-gray600" />
							) : (
								<Text className="font-pretendard-medium text-error text-[15px]">
									{t('auth.logout')}
								</Text>
							)}
						</Pressable>
					)}
				</View>
			</ScrollView>
		</Screen>
	);
}
