import { trackLogin } from '@/src/lib/analytics';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SocialPill } from '@/src/components/auth/SocialPill';
import { signInWithApple, signInWithKakao } from '@/src/utils/authOAuth';
import { supabase } from '@/src/utils/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { openLegalDocument } from '@/src/utils/openLegalDocument';

function safeReturnTo(raw: string | string[] | undefined): string {
	const value = Array.isArray(raw) ? raw[0] : raw;
	if (!value || !value.startsWith('/')) return '/(tabs)/diary';
	return value;
}

export default function LoginScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
	const destination = safeReturnTo(returnTo);

	const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);
	const [busy, setBusy] = useState<'kakao' | 'apple' | null>(null);
	const [error, setError] = useState<string | null>(null);

	const finish = useCallback(async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (user) {
			const { data: profile } = await supabase
				.from('profiles')
				.select('onboarding_completed')
				.eq('id', user.id)
				.single();

			const completed = profile?.onboarding_completed ?? false;
			setOnboardingCompleted(completed);

			if (!completed) {
				router.replace('/onboarding');
				return;
			}
		}

		router.replace(destination);
	}, [router, destination, setOnboardingCompleted]);

	const run = async (provider: 'kakao' | 'apple') => {
		if (busy) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setError(null);
		setBusy(provider);
		try {
			if (provider === 'kakao') await signInWithKakao();
			else await signInWithApple();
			void trackLogin(provider);
			await finish();
		} catch (e) {
			const message = e instanceof Error ? e.message : t('auth.login_failed');
			if (!message.includes('취소')) setError(message);
		} finally {
			setBusy(null);
		}
	};

	const busyAny = !!busy;

	return (
		<Screen variant="warm">
			<ScreenHeader className="justify-end pt-1">
				<ScreenHeader.Right>
					<Pressable
						onPress={() => router.back()}
						hitSlop={12}
						accessibilityRole="button"
						accessibilityLabel={t('common.close')}
						className="w-10 h-10 rounded-full items-center justify-center border border-white/85 bg-white/55"
						style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
					>
						<Ionicons name="close" size={20} color="#44403C" />
					</Pressable>
				</ScreenHeader.Right>
			</ScreenHeader>

			<View className="flex-1 justify-center mt-12 relative">
				<View className="items-center mt-4 mb-9 flex-1 justify-center">
					<ScreenHeader.Logo fontSize={56} />
					<Text className="text-[15px] leading-[22px] text-description text-center max-w-[280px] font-pretendard-regular">
						{t('auth.tagline')}
					</Text>
				</View>

				<View className="gap-3 pb-7 mt-12">
					<SocialPill
						label={t('auth.login_with_kakao')}
						variant="kakao"
						disabled={busyAny}
						loading={busy === 'kakao'}
						onPress={() => run('kakao')}
						icon={
							<View className="bg-[#191919] rounded px-1 py-0.5">
								<Text className="text-[8px] text-[#FEE500] tracking-[0.2px] font-pretendard-bold">
									TALK
								</Text>
							</View>
						}
					/>

					{Platform.OS === 'ios' && (
						<SocialPill
							label={t('auth.login_with_apple')}
							variant="apple"
							disabled={busyAny}
							loading={busy === 'apple'}
							onPress={() => run('apple')}
							icon={<Ionicons name="logo-apple" size={22} className="text-gray900" />}
						/>
					)}

					{error && (
						<Text className="text-[13px] text-[#DC2626] text-center mt-1 font-pretendard-regular">
							{error}
						</Text>
					)}

					<View
						className="mt-7 px-2 justify-center gap-1"
						style={{ marginBottom: insets.bottom + 12 }}
					>
						<Text className="text-[11px] leading-[16px] text-gray500 text-center font-pretendard-regular">
							{t('auth.legal_agreement_prefix')}
						</Text>
						<View className="flex-row gap-1 justify-center">
							<View className="flex-row">
								<Pressable onPress={() => void openLegalDocument('privacy')}>
									<Text className="text-[11px] leading-[16px] text-black/70 text-center font-pretendard-medium">
										{t('auth.privacy_policy')}
									</Text>
								</Pressable>
								<Text className="text-[11px] leading-[16px] text-gray500 text-center font-pretendard-regular">
									{t('auth.legal_and')}
								</Text>
							</View>
							<View className="flex-row">
								<Pressable onPress={() => void openLegalDocument('terms')}>
									<Text className="text-[11px] leading-[16px] text-black/70 text-center font-pretendard-medium">
										{t('auth.terms_of_service')}
									</Text>
								</Pressable>
								<Text className="text-[11px] leading-[16px] text-gray500 text-center font-pretendard-regular">
									{t('auth.legal_agreement_suffix')}
								</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		</Screen>
	);
}
