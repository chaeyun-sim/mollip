import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { Screen } from '@/src/components/layout/Screen';
import { useToast } from '@/src/providers/ToastProvider';
import { ENTITLEMENT_ID, syncSubscription } from '@/src/lib/subscription';
import { cn } from '@/src/lib/cn';

type PlanId = 'weekly' | 'monthly' | 'sixMonths';

const PACKAGE_IDS: Record<PlanId, string> = {
	weekly: '$rc_weekly',
	monthly: '$rc_monthly',
	sixMonths: '$rc_six_month',
};

const PERIOD_LABEL: Record<PlanId, string> = {
	weekly: '주',
	monthly: '월',
	sixMonths: '6개월',
};

const PLANS: {
	id: PlanId;
	title: string;
	price: string;
	period: string;
	detail: string;
	badge?: string;
}[] = [
	{
		id: 'sixMonths',
		title: '6개월',
		price: '₩34,900',
		period: '/6개월',
		detail: '일 193원',
		badge: '26% 할인',
	},
	{ id: 'weekly', title: '1주', price: '₩3,900', period: '/주', detail: '일 557원' },
	{ id: 'monthly', title: '1개월', price: '₩7,900', period: '/월', detail: '일 263원' },
];

const BENEFITS = [
	'셀프 오디오 가이드 무제한',
	'작품을 기반으로 AI와 채팅',
	'전시 티켓을 나만의 기록으로 간직하기',
	'10+ AI 음성 스타일',
];

// const computeExpiresAt = (plan: PlanId): string => {
// 	const date = new Date();
// 	if (plan === 'weekly') date.setDate(date.getDate() + 7);
// 	if (plan === 'monthly') date.setMonth(date.getMonth() + 1);
// 	if (plan === 'sixMonths') date.setMonth(date.getMonth() + 6);
// 	return date.toISOString().slice(0, 10);
// };

export default function PremiumScreen() {
	const router = useRouter();
	const [selectedPlan, setSelectedPlan] = useState<PlanId>('sixMonths');

	const [packages, setPackages] = useState<PurchasesPackage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isPurchasing, setIsPurchasing] = useState(false);

	const { showToast } = useToast();
	// const { isPremium, setSubscription, recordTestPurchase } = useSubscriptionStore();

	useEffect(() => {
		const loadOfferings = async () => {
			try {
				setIsLoading(true);

				const offerings = await Purchases.getOfferings();
				const current = offerings.current;

				if (!current) {
					console.error('현재 활성화된 RevenueCat Offering이 없습니다.');
					showToast('상품 정보를 불러오지 못했어요.');
					return;
				}

				setPackages(current.availablePackages);
			} catch (error) {
				console.error('RevenueCat Offering 조회 실패:', error);
				showToast('상품 정보를 불러오지 못했어요.');
			} finally {
				setIsLoading(false);
			}
		};

		void loadOfferings();
	}, [showToast]);

	const selectedPackage = packages.find((pkg) => pkg.identifier === PACKAGE_IDS[selectedPlan]);

	const handlePurchase = async () => {
		if (!selectedPackage || isPurchasing) return;

		try {
			setIsPurchasing(true);

			const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

			syncSubscription(customerInfo);

			if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
				showToast('몰립 프리미엄이 시작됐어요!');
				router.back();
			}
		} catch (error: any) {
			if (error?.userCancelled) return;

			console.error('결제 실패:', error);
			showToast('결제 중 문제가 발생했어요.');
		} finally {
			setIsPurchasing(false);
		}
	};

	const handleRestore = async () => {
		try {
			const customerInfo = await Purchases.restorePurchases();

			const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

			if (!entitlement) {
				showToast('복원할 프리미엄 구독이 없어요.');
				return;
			}

			showToast('구독을 복원했어요!');
		} catch (error) {
			console.error('RevenueCat 구매 복원 실패:', error);
			showToast('구매 복원 중 문제가 발생했어요.');
		}
	};

	// TODO: 실제 StoreKit/RevenueCat 연동 전 테스트용 — 결제 없이 구독 상태·이력만 기록한다.
	// const handleTestPurchase = () => {
	// 	const plan = PLANS.find((p) => p.id === selectedPlan)!;
	// 	recordTestPurchase({
	// 		planTitle: `${plan.title} 정기구독`,
	// 		price: plan.price,
	// 		expiresAt: computeExpiresAt(selectedPlan),
	// 	});
	// 	showToast('프리미엄으로 전환됐어요 (테스트)');
	// 	router.back();
	// };

	// const handleTestReset = () => {
	// 	setSubscription({ isPremium: false });
	// 	showToast('무료 회원으로 되돌렸어요 (테스트)');
	// };

	const selectedPrice =
		selectedPackage?.product.priceString ??
		PLANS.find((plan) => plan.id === selectedPlan)?.price ??
		'';

	return (
		<Screen variant="dark" className="px-0 pt-2">
			<View className="flex-1">
				<View className="flex-1">
					<View className="relative mx-4 mt-2 h-[30%] overflow-hidden rounded-[24px] bg-gray900">
						<Pressable
							onPress={() => router.back()}
							accessibilityRole="button"
							accessibilityLabel="프리미엄 화면 닫기"
							hitSlop={8}
							className="absolute right-6 top-6 h-11 w-11 items-center justify-center rounded-full bg-gray900/85 z-[9999]"
						>
							<Ionicons name="close" size={22} color="#FFFFFF" />
						</Pressable>
						<Text className="absolute bottom-6 left-6 font-pretendard-bold text-[22px] leading-[29px] text-white z-[9999]">{`몰립 프리미엄으로\n모든 기능을 경험해보세요!`}</Text>
						<ImageBackground
							source={require('@/assets/images/genres/paintings-pearl-vertical.jpg')}
							resizeMode="cover"
							className="absolute inset-0 z-[1000]"
							accessibilityLabel="진주 귀걸이를 한 소녀 그림"
						/>
					</View>

					<View className="px-6 mt-2 flex-1 justify-between">
						<View className="mt-3 gap-3 rounded-2xl bg-white/[0.06] p-4">
							{BENEFITS.map((benefit) => (
								<View key={benefit} className="flex-row items-center gap-3">
									<View className="h-4 w-4 items-center justify-center rounded-full bg-primary">
										<Ionicons name="checkmark" size={11} color="#241A32" />
									</View>
									<Text className="font-pretendard-medium text-[13px] text-white/90">
										{benefit}
									</Text>
								</View>
							))}
						</View>
						<View className="mt-3 gap-3 pb-3">
							{PLANS.map((plan) => {
								const selected = selectedPlan === plan.id;
								const revenueCatPackage = packages.find(
									(pkg) => pkg.identifier === PACKAGE_IDS[plan.id],
								);
								const price = revenueCatPackage?.product.priceString ?? plan.price;

								return (
									<Pressable
										key={plan.id}
										onPress={() => setSelectedPlan(plan.id)}
										accessibilityRole="radio"
										accessibilityState={{ selected }}
										accessibilityLabel={`${plan.title} ${price}${plan.period}, ${plan.detail}`}
										className={cn(
											'relative min-h-[64px] justify-center rounded-[17px] border px-4 py-3',
											selected
												? 'border-[#C9B1FF] bg-[#30233D]'
												: 'border-transparent bg-white/[0.07]',
										)}
									>
										<View className="flex-row items-center justify-between">
											<View className="flex-row items-center gap-3">
												<Ionicons
													name={selected ? 'checkmark-circle' : 'ellipse-outline'}
													size={19}
													color={selected ? '#D38BFF' : '#6F6878'}
												/>
												<View className="gap-1">
													<Text className="font-pretendard-bold text-[15px] text-white">
														{plan.title}
													</Text>
													{selected && (
														<Text className="font-pretendard-medium text-[11px] text-white/65">
															{plan.detail}
														</Text>
													)}
												</View>
											</View>
											<Text className="font-pretendard-bold text-[15px] text-white">
												{price}
												<Text className="font-pretendard-regular text-[12px] text-white/70">
													{plan.period}
												</Text>
											</Text>
										</View>
										{plan.badge && selected && (
											<View className="absolute -top-3 right-4 rounded-[9px] bg-[#E985FF] px-2.5 py-1">
												<Text className="font-pretendard-bold text-[11px] text-[#24132C]">
													{plan.badge}
												</Text>
											</View>
										)}
									</Pressable>
								);
							})}
						</View>
					</View>
				</View>

				<View className="border-t border-white/10 bg-[#171412] px-6 pt-2.5 pb-3">
					<Pressable
						onPress={handlePurchase}
						disabled={isLoading || isPurchasing || !selectedPackage}
						accessibilityRole="button"
						accessibilityLabel="결제하기"
						className="h-[50px] items-center justify-center rounded-[12px] bg-primary-dark"
						style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
					>
						<Text className="font-pretendard-bold text-[14px] text-white">결제하기</Text>
					</Pressable>
					<Text className="font-pretendard-medium text-xs text-white/65 mt-3 -mb-1 text-center">
						{`취소 전까지 ${selectedPrice}/${PERIOD_LABEL[selectedPlan]} 자동 갱신`}
					</Text>
					<View className="flex-row items-center justify-center gap-4">
						<Pressable
							onPress={handleRestore}
							accessibilityRole="button"
							accessibilityLabel="구독 복원하기"
							hitSlop={8}
							className="min-h-11 justify-center"
						>
							<Text className="font-pretendard-medium text-xs text-white/65">구매 복원</Text>
						</Pressable>
						<Pressable
							onPress={() => router.push('/terms')}
							accessibilityRole="link"
							accessibilityLabel="이용약관 열기"
							hitSlop={8}
							className="min-h-11 justify-center"
						>
							<Text className="font-pretendard-medium text-xs text-white/65">이용약관</Text>
						</Pressable>
						<Pressable
							onPress={() => router.push('/privacy-policy')}
							accessibilityRole="link"
							accessibilityLabel="개인정보 처리방침 열기"
							hitSlop={8}
							className="min-h-11 justify-center"
						>
							<Text className="font-pretendard-medium text-xs text-white/65">
								개인정보 처리방침
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Screen>
	);
}
