import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SocialPill } from '@/src/components/auth/SocialPill';
import { SERVICE_NAME } from '@/src/constants/service-name';
import { signInWithApple, signInWithKakao } from '@/src/utils/authOAuth';
import { supabase } from '@/src/utils/supabase';

function safeReturnTo(raw: string | string[] | undefined): string {
	const value = Array.isArray(raw) ? raw[0] : raw;
	if (!value || !value.startsWith('/')) return '/(tabs)/archive';
	return value;
}

export default function LoginScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
	const destination = safeReturnTo(returnTo);

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

			if (profile && !profile.onboarding_completed) {
				router.replace('/onboarding' as never);
				return;
			}
		}

		router.replace(destination as never);
	}, [router, destination]);

	const run = async (provider: 'kakao' | 'apple') => {
		if (busy) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setError(null);
		setBusy(provider);
		try {
			if (provider === 'kakao') await signInWithKakao();
			else await signInWithApple();
			await finish();
		} catch (e) {
			const message = e instanceof Error ? e.message : '로그인에 실패했습니다';
			if (!message.includes('취소')) setError(message);
		} finally {
			setBusy(null);
		}
	};

	const busyAny = !!busy;

	return (
		<View className='flex-1 bg-[#F8F6F2]'>
			<StatusBar style='dark' />
			<LinearGradient
				colors={['#FFF3E6', '#F7DFCE', '#E4CCE8', '#F8F6F2']}
				locations={[0, 0.32, 0.68, 1]}
				style={StyleSheet.absoluteFill}
			/>

			<View
				className='flex-1 px-7'
				style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}
			>
				<View className='flex-row justify-end pt-1'>
					<Pressable
						onPress={() => router.back()}
						hitSlop={12}
						accessibilityRole='button'
						accessibilityLabel='닫기'
						className='w-10 h-10 rounded-full items-center justify-center border border-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.55)]'
						style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
					>
						<Ionicons name='close' size={20} color='#44403C' />
					</Pressable>
				</View>

				<View className='flex-1 justify-center mt-12 relative'>
					<View className='items-center mb-9 flex-1 justify-center'>
						<Text
							className='text-[56px] text-[#1C1917] mb-2.5 tracking-[-1px]'
							style={{ fontFamily: 'CormorantGaramond_700Bold' }}
						>
							{SERVICE_NAME}
						</Text>
						<Text
							className='text-[15px] leading-[22px] text-[#6B6360] text-center max-w-[280px] font-pretendard-regular'
						>
							{`예술에 몰입하는 가장 조용한 방법`}
						</Text>
					</View>

					<View className='gap-3 pb-10 mt-12'>
						<SocialPill
							label='카카오로 시작하기'
							variant='kakao'
							disabled={busyAny}
							loading={busy === 'kakao'}
							onPress={() => run('kakao')}
							icon={
								<View className='bg-[#191919] rounded px-1 py-0.5'>
									<Text
										className='text-[8px] text-[#FEE500] tracking-[0.2px]'
										style={{ fontFamily: 'Pretendard-Bold' }}
									>
										TALK
									</Text>
								</View>
							}
						/>

						{Platform.OS === 'ios' ? (
							<SocialPill
								label='Apple로 시작하기'
								variant='apple'
								disabled={busyAny}
								loading={busy === 'apple'}
								onPress={() => run('apple')}
								icon={<Ionicons name='logo-apple' size={22} color='#1C1917' />}
							/>
						) : null}

						{error ? (
							<Text
								className='text-[13px] text-[#DC2626] text-center mt-1'
								style={{ fontFamily: 'Pretendard-Regular' }}
							>
								{error}
							</Text>
						) : null}

						<Text
							className='text-[11px] leading-[16px] text-[#A8A29E] text-center mt-2 px-2'
							style={{ fontFamily: 'Pretendard-Regular' }}
						>
							로그인 시 서비스 이용에 필요한 계정 정보만 저장됩니다. 둘러보기·지도·가이드는 로그인
							없이 이용할 수 있어요.
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}
