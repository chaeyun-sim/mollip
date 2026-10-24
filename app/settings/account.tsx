import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/src/components/common/Button';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { useAuthStore } from '@/src/store/authStore';

export default function AccountScreen() {
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
				<Screen.Header.Center>계정 정보</Screen.Header.Center>
			</Screen.Header>

			<View className="flex-1 mt-5 gap-4">
				{user.email && (
					<SettingsCard>
						<CardRow icon="mail-outline" label="이메일" value={user.email} />
						<CardRow
							icon="log-in-outline"
							label="로그인 방법"
							value={
								user.app_metadata.provider?.toUpperCase() === 'KAKAO'
									? '카카오 로그인'
									: '애플 로그인'
							}
						/>
					</SettingsCard>
				)}

				<SettingsCard>
					<Pressable
						onPress={showWithdrawWarning ? undefined : handleDeleteAccoun}
						accessibilityRole="button"
						accessibilityLabel="회원탈퇴"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						className="flex-row items-center h-16"
					>
						<View className="w-8 h-8 rounded-full bg-error/10 items-center justify-center mr-3">
							<Ionicons name="person-remove-outline" size={16} className="text-error" />
						</View>
						<Text className="flex-1 font-pretendard-medium text-error text-base">탈퇴하기</Text>
						{showWithdrawWarning && <ActivityIndicator size="small" className="text-gray600" />}
					</Pressable>
				</SettingsCard>
			</View>

			<Modal
				visible={showWithdrawWarning}
				transparent
				animationType="slide"
				onRequestClose={() => setShowWithdrawWarning(false)}
			>
				<Pressable
					className="flex-1 justify-end bg-[rgba(0,0,0,0.5)]"
					onPress={() => setShowWithdrawWarning(false)}
				>
					<Pressable
						className="w-full rounded-t-3xl bg-white p-6 pb-9"
						onPress={(e) => e.stopPropagation()}
					>
						<Text className="text-[17px] font-pretendard-semibold text-gray900 mb-2">
							정말 탈퇴할까요?
						</Text>
						<Text className="text-[13px] leading-[20px] font-pretendard-regular text-gray600 mb-6">
							계정 정보, 관람 기록, 저장한 전시가 모두 삭제되며{'\n'}이 작업은 되돌릴 수 없어요.
						</Text>
						<View className="flex-row gap-2">
							<Pressable
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setShowWithdrawWarning(false);
								}}
								className="flex-1 rounded-2xl border border-secondary bg-transparent items-center justify-center py-[14px]"
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								accessibilityRole="button"
								accessibilityLabel="닫기"
							>
								<Text className="font-pretendard-semibold text-[15px] text-secondary">닫기</Text>
							</Pressable>
							<Button
								onPress={() => {
									setShowWithdrawWarning(false);
									router.push('/settings/delete-account');
								}}
								tone="danger"
								haptic="light"
								block={false}
								className="flex-1"
								accessibilityLabel="그래도 탈퇴할래요"
							>
								그래도 탈퇴할래요
							</Button>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</Screen>
	);
}
