import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { colors } from '@/src/constants/colors';
import { formatSubscriptionDate } from '@/src/lib/subscription';
import { resolveSubscriptionPlan, type SubscriptionPlan } from '@/src/lib/subscriptionPlan';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';

const PLAN_NAME_KEYS: Record<SubscriptionPlan, string> = {
	weekly: 'subscribe.plan_weekly',
	monthly: 'subscribe.plan_monthly',
	sixMonths: 'subscribe.plan_six_months',
};

const BENEFIT_KEYS = [
	'premium.benefit_audio_guide',
	'premium.benefit_ai_chat',
	'premium.benefit_ticket',
	'premium.benefit_voices',
];

export default function SubscribeScreen() {
	const { t, i18n } = useTranslation();

	const { productIdentifier, expirationDate, willRenew } = useSubscriptionStore();

	const isEn = i18n.language === 'en';
	const getPlanTitle = () => {
		if (!productIdentifier) return '-';
		const plan = resolveSubscriptionPlan(productIdentifier);
		// 상품 ID를 판별하지 못하면 원문 ID 대신 'Premium'으로 안내한다
		if (plan) return t(PLAN_NAME_KEYS[plan]);
		return t('subscribe.plan_unknown');
	};
	const planTitle = getPlanTitle();
	// 한국어 날짜(2026. 11. 21.)는 끝의 마침표만 뗀다 — 영어(11/21/2026)는 그대로 쓴다
	const expirationLabel = isEn
		? formatSubscriptionDate(expirationDate, 'en-US')
		: formatSubscriptionDate(expirationDate).slice(0, -1);

	const openSubscriptionManagement = async () => {
		try {
			const customerInfo = await Purchases.getCustomerInfo();

			if (!customerInfo.managementURL) {
				Alert.alert(t('subscribe.no_subscription_title'), t('subscribe.no_subscription_body'));
				return;
			}

			await Linking.openURL(customerInfo.managementURL);
		} catch (error) {
			console.error('구독 관리 화면 열기 실패:', error);
			Alert.alert(t('subscribe.open_failed_title'), t('subscribe.open_failed_body'));
		}
	};

	return (
		<Screen variant="warm" className="px-0">
			<Screen.Header fullBleed>
				<Screen.Header.Back />
				<Screen.Header.Center>{t('settings.manage_subscription')}</Screen.Header.Center>
			</Screen.Header>

			<View className="gap-4 mt-2 px-6">
				<LinearGradient
					colors={[colors['bg-dark'], colors.brand, colors.editorial]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={{ paddingHorizontal: 20, paddingVertical: 20, borderRadius: 16 }}
				>
					<View className="flex-row items-center gap-2" style={{ marginBottom: 16 }}>
						<Ionicons name="sparkles" size={16} color="#FFFFFF" />
						<Text className="font-pretendard-bold text-white text-base tracking-wide">
							{t('subscribe.badge')}
						</Text>
					</View>

					<View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
						<Text className="font-pretendard-medium text-white/70 text-[13px]">
							{willRenew ? t('subscribe.next_billing') : t('subscribe.available_until')}
						</Text>
						<Text className="font-pretendard-semibold text-white text-[14px]">
							{expirationLabel}
						</Text>
					</View>

					<View className="flex-row items-center justify-between">
						<Text className="font-pretendard-medium text-white/70 text-[13px]">
							{t('subscribe.current_plan')}
						</Text>
						<Text className="font-pretendard-semibold text-white text-[14px]">{planTitle}</Text>
					</View>
				</LinearGradient>

				<SettingsCard>
					<CardRow label={t('subscribe.manage_in_store')} onPress={openSubscriptionManagement} />
				</SettingsCard>

				<SettingsCard>
					<View className="py-4 mt-2">
						<Text className="font-pretendard-bold text-secondary text-[15px] mb-4">
							{t('subscribe.benefits_title')}
						</Text>

						<View className="gap-3.5">
							{BENEFIT_KEYS.map((benefitKey) => (
								<View key={benefitKey} className="flex-row items-center gap-2">
									{/* 체크 아이콘 대신 프리미엄 느낌의 보라색/반짝이 아이콘 추천 */}
									<View className="h-5 w-5 items-center justify-center rounded-full">
										<Ionicons name="sparkles" size={14} className="text-brand-on-dark" />
									</View>
									<Text className="font-pretendard-medium text-sm text-secondary">
										{t(benefitKey)}
									</Text>
								</View>
							))}
						</View>
					</View>
				</SettingsCard>

				<View className="pb-6 items-center">
					<Text className="font-pretendard-regular text-[11px] text-secondary text-center">
						{t('subscribe.question')}
						{'\n'}
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
						accessibilityLabel={t('subscribe.inquiry_a11y')}
					>
						<Text className="underline text-[11px] text-secondary text-center">
							{t('settings.inquiry')}
						</Text>
					</Pressable>
				</View>
			</View>
		</Screen>
	);
}
