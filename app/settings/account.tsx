import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { useAuthStore } from '@/src/store/authStore';

export default function AccountScreen() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const signOut = useAuthStore((s) => s.signOut);
	const [signingOut, setSigningOut] = useState(false);
	const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);

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

	if (!user) return null;

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Back color='#1C1917' onPress={() => router.back()} />
				<Screen.Header.Center>
					<Text className='text-[18px] text-[#1C1917] font-hahmlet-semibold'>
						계정 정보
					</Text>
				</Screen.Header.Center>
			</Screen.Header>

			<View className='flex-1 mt-5'>
				{/* 이메일 행 */}
				{user.email && (
					<View className='flex-row items-center justify-between px-1 py-3 mb-6'>
						<Text className='font-pretendard-medium text-[14px] text-[#1C1917]'>
							이메일
						</Text>
						<Text
							className='font-pretendard-regular text-[13px] text-[#A8A29E] max-w-[60%]'
							numberOfLines={1}
						>
							{user.email}
						</Text>
					</View>
				)}
				{user.email && (
					<View className='flex-row items-center justify-between px-1 py-3 mb-6'>
						<Text className='font-pretendard-medium text-[14px] text-[#1C1917]'>
							로그인 방법
						</Text>
						<Text
							className='font-pretendard-regular text-[13px] text-[#A8A29E] max-w-[60%]'
							numberOfLines={1}
						>
							{user.app_metadata.provider?.toUpperCase() === 'KAKAO'
								? '카카오 로그인'
								: '애플 로그인'}
						</Text>
					</View>
				)}

				{/* 로그아웃 */}
				<Pressable
					onPress={handleSignOut}
					disabled={signingOut}
					className='rounded-2xl bg-[#F2EFE9] flex-row items-center justify-center gap-2 py-[15px]'
					style={({ pressed }) => ({ opacity: pressed || signingOut ? 0.6 : 1 })}
					accessibilityRole='button'
					accessibilityLabel='로그아웃'
				>
					{signingOut ? (
						<ActivityIndicator color='#1C1917' />
					) : (
						<>
							<Ionicons name='log-out-outline' size={18} color='#1C1917' />
							<Text className='font-pretendard-semibold text-[15px] text-[#1C1917]'>
								로그아웃
							</Text>
						</>
					)}
				</Pressable>

				{/* 탈퇴하기 */}
				<View className='flex-1 items-center justify-end pb-10'>
					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							setShowWithdrawWarning(true);
						}}
						hitSlop={12}
						accessibilityRole='button'
						accessibilityLabel='탈퇴하기'
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
					>
						<Text className='font-pretendard-regular text-[13px] text-[#A8A29E] underline'>
							탈퇴하기
						</Text>
					</Pressable>
				</View>
			</View>

			<Modal
				visible={showWithdrawWarning}
				transparent
				animationType='fade'
				onRequestClose={() => setShowWithdrawWarning(false)}
			>
				<View className='flex-1 items-center justify-center bg-[rgba(0,0,0,0.5)] px-8'>
					<View className='w-full rounded-3xl bg-white p-6'>
						<Text className='text-[17px] font-pretendard-semibold text-[#1C1917] mb-2'>
							정말 탈퇴할까요?
						</Text>
						<Text className='text-[13px] leading-[20px] font-pretendard-regular text-[#78716C] mb-6'>
							계정 정보, 관람 기록, 저장한 전시가 모두 삭제되며{'\n'}이 작업은 되돌릴
							수 없어요.
						</Text>
						<View className='flex-row gap-2'>
							<Pressable
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setShowWithdrawWarning(false);
								}}
								className='flex-1 rounded-2xl bg-[#F2EFE9] items-center justify-center py-[14px]'
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								accessibilityRole='button'
								accessibilityLabel='닫기'
							>
								<Text className='font-pretendard-semibold text-[15px] text-[#1C1917]'>
									닫기
								</Text>
							</Pressable>
							<Pressable
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setShowWithdrawWarning(false);
									router.push('/settings/delete-account');
								}}
								className='flex-1 rounded-2xl bg-[#EF4444] items-center justify-center py-[14px]'
								style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
								accessibilityRole='button'
								accessibilityLabel='그래도 탈퇴할래요'
							>
								<Text className='font-pretendard-semibold text-[15px] text-white'>
									그래도 탈퇴할래요
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</Screen>
	);
}
