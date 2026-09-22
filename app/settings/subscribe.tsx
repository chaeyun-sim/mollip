import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { formatSubscriptionDate } from '@/src/lib/subscription';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';

const PLAN_NAMES: Record<string, string> = {
	weekly: '1주 정기구독',
	monthly: '1개월 정기구독',
	'6months': '6개월 정기구독',
};

const BENEFITS = [
	'셀프 오디오 가이드 무제한',
	'작품을 기반으로 AI와 채팅',
	'전시 티켓을 나만의 기록으로 간직하기',
	'10+ AI 음성 스타일',
];

export default function SubscribeScreen() {
	const { productIdentifier, expirationDate, willRenew } = useSubscriptionStore();

	const planTitle = productIdentifier ? (PLAN_NAMES[productIdentifier] ?? productIdentifier) : '-';

	const openSubscriptionManagement = async () => {
		try {
			const customerInfo = await Purchases.getCustomerInfo();

			if (!customerInfo.managementURL) {
				Alert.alert('구독 내역이 없어요', '현재 관리할 구독이 없습니다.');
				return;
			}

			await Linking.openURL(customerInfo.managementURL);
		} catch (error) {
			console.error('구독 관리 화면 열기 실패:', error);
			Alert.alert('구독 관리', '구독 관리 화면을 열지 못했어요.');
		}
	};

	return (
		<Screen variant="warm" className="px-0">
			<Screen.Header fullBleed>
				<Screen.Header.Back />
				<Screen.Header.Center>구독 관리</Screen.Header.Center>
			</Screen.Header>

			<View className="gap-4 mt-2 px-6">
				<LinearGradient
					colors={['#171412', '#7C3AED', '#E985FF']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={{ paddingHorizontal: 20, paddingVertical: 20, borderRadius: 16 }}
				>
					<View className="flex-row items-center gap-2" style={{ marginBottom: 16 }}>
						<Ionicons name="sparkles" size={16} color="#FFFFFF" />
						<Text className="font-pretendard-bold text-white text-base tracking-wide">
							몰립 PREMIUM
						</Text>
					</View>

					<View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
						<Text className="font-pretendard-medium text-white/70 text-[13px]">
							{willRenew ? '다음 결제일' : '이용 가능 기간'}
						</Text>
						<Text className="font-pretendard-semibold text-white text-[14px]">
							{formatSubscriptionDate(expirationDate).slice(0, -1)}
						</Text>
					</View>

					<View className="flex-row items-center justify-between">
						<Text className="font-pretendard-medium text-white/70 text-[13px]">이용 중인 플랜</Text>
						<Text className="font-pretendard-semibold text-white text-[14px]">{planTitle}</Text>
					</View>
				</LinearGradient>

				<SettingsCard>
					<CardRow label="App Store에서 구독 관리" onPress={openSubscriptionManagement} />
				</SettingsCard>

				<SettingsCard>
					<View className="py-4 mt-2">
						<Text className="font-pretendard-bold text-secondary text-[15px] mb-4">
							내가 누리고 있는 프리미엄 혜택
						</Text>

						<View className="gap-3.5">
							{BENEFITS.map((benefit) => (
								<View key={benefit} className="flex-row items-center gap-2">
									{/* 체크 아이콘 대신 프리미엄 느낌의 보라색/반짝이 아이콘 추천 */}
									<View className="h-5 w-5 items-center justify-center rounded-full">
										<Ionicons name="sparkles" size={14} className="text-primary" />
									</View>
									<Text className="font-pretendard-medium text-sm text-secondary">{benefit}</Text>
								</View>
							))}
						</View>
					</View>
				</SettingsCard>

				<View className="pb-6 items-center">
					<Text className="font-pretendard-regular text-[11px] text-secondary text-center">
						구독 관련 문의가 있으신가요?{'\n'}
					</Text>
					<Pressable
						className="-mt-2"
						onPress={() =>
							router.push({
								pathname: '/settings/inquiry',
								params: { category: 'subscription' },
							})
						}
						accessibilityRole="button"
						accessibilityLabel="구독 관련 문의하기"
					>
						<Text className="underline text-[11px] text-secondary text-center">
							고객센터 문의하기
						</Text>
					</Pressable>
				</View>
			</View>
		</Screen>
	);
}
