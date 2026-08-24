import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';
import { colors } from '@/src/constants/colors';

export default function OnboardingLocationScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

	const saveAndNavigate = useCallback(async () => {
		if (userId) {
			await supabase
				.from('profiles')
				.update({ onboarding_completed: true })
				.eq('id', userId);
			setOnboardingCompleted(true);
		}
		router.replace('/(tabs)');
	}, [router, userId, setOnboardingCompleted]);

	const handleAllow = useCallback(async () => {
		const { status } = await Location.requestForegroundPermissionsAsync();
		// granted든 denied든 다음 단계로 진행
		void status;
		await saveAndNavigate();
	}, [saveAndNavigate]);

	const handleSkip = useCallback(async () => {
		await saveAndNavigate();
	}, [saveAndNavigate]);

	return (
		<Screen variant='warm'>
			<LinearGradient
				colors={['#FFF3E6', '#F7DFCE', '#E4CCE8', colors.bgLight]}
				locations={[0, 0.32, 0.68, 1]}
				style={StyleSheet.absoluteFill}
			/>

			<View className='flex-1 items-center justify-center px-2 gap-8'>
				{/* 아이콘 */}
				<View
					className='w-20 h-20 rounded-full bg-primary items-center justify-center'
					style={{
						shadowColor: colors.primary,
						shadowOpacity: 0.18,
						shadowRadius: 20,
						shadowOffset: { width: 0, height: 6 },
						elevation: 8,
					}}
				>
					<Ionicons name='location' size={36} color='white' />
				</View>

				{/* 설명 */}
				<View className='gap-2 items-center'>
					<Text className='text-primary text-[24px] font-hahmlet-bold text-center leading-[30px]'>
						주변 전시를{'\n'}바로 찾을 수 있어요
					</Text>
					<Text className='text-[#6B6360] text-[13px] font-pretendard-regular text-center leading-[20px] mt-1'>
						위치를 허용하면 가까운 미술관을{'\n'}지도에서 바로 확인할 수 있어요
					</Text>
				</View>

				{/* 시스템 다이얼로그 미리보기 카드 */}
				<View
					className='w-full rounded-[18px] bg-[#EFECE6] overflow-hidden'
					style={{
						shadowColor: '#000',
						shadowOpacity: 0.06,
						shadowRadius: 12,
						shadowOffset: { width: 0, height: 2 },
						elevation: 3,
					}}
				>
					<View className='px-5 py-8 items-center gap-0.5'>
						<Text className='text-primary text-[15px] font-pretendard-semibold'>
							위치 접근 허용
						</Text>
						<Text className='text-[#6B6360] text-[12px] font-pretendard-regular mt-1'>
							mollip이 내 위치에 접근하려고 합니다
						</Text>
					</View>
					<View className='h-px bg-black/[0.07]' />
					<View className='py-3.5 items-center border-b border-black/[0.07]'>
						<Text className='text-primary text-[15px] font-pretendard-semibold'>
							앱을 사용하는 동안 허용
						</Text>
					</View>
					<View className='py-3.5 items-center border-b border-black/[0.07]'>
						<Text className='text-primary text-[15px] font-pretendard-regular'>
							한 번 허용
						</Text>
					</View>
					<View className='py-3.5 items-center'>
						<Text className='text-primary/40 text-[15px] font-pretendard-regular'>
							허용 안 함
						</Text>
					</View>
				</View>
			</View>

			<Screen.Bottom className='pb-10 gap-3'>
				<Pressable
					className='w-full bg-primary items-center justify-center rounded-[18px] py-[18px] border-[0.5px] border-white/25'
					style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
					onPress={handleAllow}
					accessibilityRole='button'
					accessibilityLabel='위치 허용하기'
				>
					<Text className='text-[16px] text-white font-pretendard-semibold'>
						허용하기
					</Text>
				</Pressable>
				<Pressable
					className='items-center justify-center py-3'
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
					onPress={handleSkip}
					accessibilityRole='button'
					accessibilityLabel='나중에 설정'
				>
					<Text className='text-[14px] text-[#6B6360] font-pretendard-regular'>
						나중에 설정할게요
					</Text>
				</Pressable>
			</Screen.Bottom>
		</Screen>
	);
}
