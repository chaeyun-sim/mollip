import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { Indicator } from '@/src/components/common/Indicator';
import { useToast } from '@/src/providers/ToastProvider';
import {
	computeDiscountPercent,
	computePerDayPrice,
	formatPerDayPrice,
} from '@/src/lib/purchasePricing';
import {
	OFFERING_ERROR_MESSAGE,
	PACKAGE_IDS,
	PLAN_ORDER,
	usePremiumPurchase,
	type PlanId,
} from '@/src/hooks/usePremiumPurchase';
import { cn } from '@/src/lib/cn';
import { NETWORK_UNAVAILABLE_MESSAGE } from '@/src/lib/networkErrors';
import { usePurchaseLockStore } from '@/src/store/purchaseLockStore';

const PLAN_TITLE: Record<PlanId, string> = {
	weekly: '1주',
	monthly: '1개월',
	sixMonths: '6개월',
};

const PERIOD_LABEL: Record<PlanId, string> = {
	weekly: '주',
	monthly: '월',
	sixMonths: '6개월',
};

const BENEFITS = [
	'셀프 오디오 가이드 무제한',
	'작품을 기반으로 AI와 채팅',
	'전시 티켓을 나만의 기록으로 간직하기',
	'10+ AI 음성 스타일',
];

export default function PremiumScreen() {
	const router = useRouter();
	const { showToast } = useToast();

	const {
		selectedPlan,
		setSelectedPlan,
		packages,
		loadState,
		isPurchasing,
		isRestoring,
		isCheckingStatus,
		purchaseStatus,
		isPendingTransaction,
		isPurchaseInFlight,
		selectedPackage,
		loadOfferings,
		handlePurchase,
		handleCheckPendingStatus,
		handleRestore,
	} = usePremiumPurchase({
		navigateAway: () => {
			if (router.canGoBack()) {
				router.back();
			} else {
				router.replace('/(tabs)');
			}
		},
		showToast,
	});

	// X 버튼도 navigateAway와 같은 방식으로 back stack 유무를 확인한다 — router.back()을
	// 직접 호출하면 (다이어리처럼 replace로 진입해) 뒤로 갈 화면이 없을 때 "GO_BACK is not
	// handled" 경고가 뜬다.
	const handleClose = () => {
		if (router.canGoBack()) {
			router.back();
		} else {
			router.replace('/(tabs)');
		}
	};

	const weeklyPackage = packages.find((pkg) => pkg.identifier === PACKAGE_IDS.weekly);
	const weeklyPerDay = weeklyPackage
		? {
				perDay: computePerDayPrice(weeklyPackage.product),
				currencyCode: weeklyPackage.product.currencyCode,
			}
		: null;

	const isReady = loadState === 'ready';
	const isUncertain = purchaseStatus === 'uncertain';
	const isTimedOut = purchaseStatus === 'timedOut';
	// USR-05 D2: 재실행 직후 부트스트랩 자동 재확인이 실패하면 purchaseStatus는 로컬 상태라
	// 항상 'idle'로 초기화되지만, 영속 pending 표식(isPendingTransaction)은 남아 있을 수
	// 있다 — 이 경우도 uncertain/timedOut과 동일하게 재확인 UI를 보여줘야 막다른 상태가
	// 되지 않는다.
	const needsReconciliationCheck = isUncertain || isTimedOut || isPendingTransaction;
	// USR-05 D7: 이 화면에서 구매가 진행 중이면(표식 저장 대기 포함) 배너 없이 결제 버튼
	// Indicator로만 보여준다 — 진행 중 구매를 "이전 구매"로 안내하지 않는다(02-design-brief 우선순위 1).
	const showReconciliationBanner = needsReconciliationCheck && !isPurchasing;
	const isPurchaseLocked = usePurchaseLockStore((s) => s.isLocked);
	// 진행 중인 작업(구매/복원/상태확인) 또는 재확인이 필요한 상태에서는 화면을 벗어나거나
	// 다른 작업을 동시에 시작하지 못하게 막는다 — 닫기 버튼·스와이프 제스처 포함.
	const isBusy = isPurchasing || isRestoring || isCheckingStatus;
	const isPurchaseDisabled = !isReady || isBusy || needsReconciliationCheck || !selectedPackage;
	const isRestoreDisabled = isBusy || needsReconciliationCheck;
	const isPlanDisabled = isBusy || needsReconciliationCheck;

	// 02-design-brief 배너 판정 우선순위 2~5 — 하나의 문구만 고른다.
	const resolveReconciliationMessage = () => {
		if (isTimedOut) return '구매 확인에 시간이 걸리고 있어요. 화면을 나가도 결과는 계속 확인돼요.';
		if (isUncertain) {
			return '구매 결과를 확인하고 있어요. 다시 구매하지 말고 잠시 후 상태를 확인해 주세요.';
		}
		if (isPurchaseInFlight)
			return '결제 처리가 아직 끝나지 않았어요. 잠시 후 상태를 확인해 주세요.';
		return '이전에 진행하던 구매가 있어요. 상태를 확인한 뒤 다시 시도해 주세요.';
	};
	const reconciliationMessage = resolveReconciliationMessage();
	// NET-03: 결제 결과가 불확실(uncertain)한 동안에는 닫기/스와이프 뒤로가기도 막는다 —
	// 확인 없이 화면을 벗어나면 사용자가 "상태 확인" 액션을 놓치고 다음에 또 결제를 시도해
	// 중복 트랜잭션을 만들 위험이 있다.
	// 구매 완료 직후 isPurchasing이 먼저 풀려도, 전역 잠금이 남아 있는 동안에는 스와이프를 막는다.
	const isCloseDisabled = isBusy || isUncertain || isPurchaseLocked;
	const selectedPriceString = selectedPackage?.product.priceString ?? '';

	return (
		<Screen variant="dark" className="px-0 pt-2">
			<Stack.Screen options={{ gestureEnabled: !isCloseDisabled }} />
			<View className="flex-1">
				<View className="flex-1">
					<View className="relative mx-4 mt-2 h-[30%] overflow-hidden rounded-[24px] bg-gray900">
						<Pressable
							onPress={handleClose}
							disabled={isCloseDisabled}
							accessibilityRole="button"
							accessibilityLabel="프리미엄 화면 닫기"
							accessibilityState={{ disabled: isCloseDisabled }}
							hitSlop={8}
							className={cn(
								'absolute right-6 top-6 h-11 w-11 items-center justify-center rounded-full bg-gray900/85 z-[9999]',
								isCloseDisabled && 'opacity-40',
							)}
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

						{loadState === 'loading' && (
							<View className="mt-3 flex-1 items-center justify-center pb-3">
								<Indicator color="white" />
							</View>
						)}

						{loadState === 'error' && (
							<View className="mt-3 flex-1 items-center justify-center gap-4 pb-3">
								<Text className="text-center font-pretendard-medium text-[13px] text-white/80">
									{OFFERING_ERROR_MESSAGE}
								</Text>
								<Text className="text-center font-pretendard-medium text-[13px] text-white/80">
									{NETWORK_UNAVAILABLE_MESSAGE}
								</Text>
								<Pressable
									onPress={() => void loadOfferings()}
									accessibilityRole="button"
									accessibilityLabel="상품 정보 다시 불러오기"
									className="min-h-11 items-center justify-center rounded-full bg-white/10 px-6"
								>
									<Text className="font-pretendard-bold text-[13px] text-white">다시 시도</Text>
								</Pressable>
							</View>
						)}

						{isReady && (
							<View className="mt-3 gap-3 pb-3">
								{PLAN_ORDER.filter((planId) =>
									packages.some((pkg) => pkg.identifier === PACKAGE_IDS[planId]),
								).map((planId) => {
									const selected = selectedPlan === planId;
									const revenueCatPackage = packages.find(
										(pkg) => pkg.identifier === PACKAGE_IDS[planId],
									)!;
									const price = revenueCatPackage.product.priceString;
									const perDayLabel = formatPerDayPrice(revenueCatPackage.product);
									const discountPercent =
										planId !== 'weekly'
											? computeDiscountPercent(weeklyPerDay, {
													perDay: computePerDayPrice(revenueCatPackage.product),
													currencyCode: revenueCatPackage.product.currencyCode,
												})
											: null;

									return (
										<Pressable
											key={planId}
											onPress={() => setSelectedPlan(planId)}
											disabled={isPlanDisabled}
											accessibilityRole="radio"
											accessibilityState={{ selected, disabled: isPlanDisabled }}
											accessibilityLabel={`${PLAN_TITLE[planId]} ${price}${perDayLabel ? `, 일 ${perDayLabel}` : ''}`}
											className={cn(
												'relative min-h-[64px] justify-center rounded-[17px] border px-4 py-3',
												selected
													? 'border-[#C9B1FF] bg-[#30233D]'
													: 'border-transparent bg-white/[0.07]',
												isPlanDisabled && !selected && 'opacity-40',
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
															{PLAN_TITLE[planId]}
														</Text>
														{selected && perDayLabel && (
															<Text className="font-pretendard-medium text-[11px] text-white/65">
																{`일 ${perDayLabel}`}
															</Text>
														)}
													</View>
												</View>
												<Text className="font-pretendard-bold text-[15px] text-white">
													{price}
													<Text className="font-pretendard-regular text-[12px] text-white/70">
														{`/${PERIOD_LABEL[planId]}`}
													</Text>
												</Text>
											</View>
											{discountPercent !== null && discountPercent > 0 && selected && (
												<View className="absolute -top-3 right-4 rounded-[9px] bg-[#E985FF] px-2.5 py-1">
													<Text className="font-pretendard-bold text-[11px] text-[#24132C]">
														{`${discountPercent}% 할인`}
													</Text>
												</View>
											)}
										</Pressable>
									);
								})}
							</View>
						)}
					</View>
				</View>

				<View className="border-t border-white/10 bg-[#171412] px-6 pt-2.5 pb-3">
					{showReconciliationBanner && (
						<View className="mb-3 gap-2 rounded-2xl bg-white/[0.08] p-3.5">
							<Text className="font-pretendard-medium text-[12px] text-white/85">
								{reconciliationMessage}
							</Text>
							<Pressable
								onPress={() => void handleCheckPendingStatus()}
								disabled={isCheckingStatus}
								accessibilityRole="button"
								accessibilityLabel="결제 상태 확인하기"
								accessibilityState={{ busy: isCheckingStatus, disabled: isCheckingStatus }}
								className={cn(
									'h-11 items-center justify-center rounded-[10px] bg-white/15',
									isCheckingStatus && 'opacity-60',
								)}
							>
								{isCheckingStatus ? (
									<Indicator color="white" />
								) : (
									<Text className="font-pretendard-bold text-[13px] text-white">상태 확인</Text>
								)}
							</Pressable>
						</View>
					)}
					<Pressable
						onPress={handlePurchase}
						disabled={isPurchaseDisabled}
						accessibilityRole="button"
						accessibilityLabel="결제하기"
						accessibilityHint={
							showReconciliationBanner ? '결제 상태를 먼저 확인해 주세요.' : undefined
						}
						accessibilityState={{ disabled: isPurchaseDisabled, busy: isPurchasing }}
						className={cn(
							'h-[50px] items-center justify-center rounded-[12px] bg-primary-dark',
							isPurchaseDisabled && 'opacity-50',
						)}
						style={({ pressed }) => ({
							opacity: pressed && !isPurchaseDisabled ? 0.85 : undefined,
						})}
					>
						{isPurchasing ? (
							<Indicator color="white" />
						) : (
							<Text className="font-pretendard-bold text-[14px] text-white">결제하기</Text>
						)}
					</Pressable>
					{isReady && selectedPackage && (
						<Text className="font-pretendard-medium text-xs text-white/65 mt-3 -mb-1 text-center">
							{`취소 전까지 ${selectedPriceString}/${PERIOD_LABEL[selectedPlan]} 자동 갱신`}
						</Text>
					)}
					<View className="flex-row items-center justify-center gap-4">
						<Pressable
							onPress={handleRestore}
							disabled={isRestoreDisabled}
							accessibilityRole="button"
							accessibilityLabel="구매 복원하기"
							accessibilityState={{ disabled: isRestoreDisabled, busy: isRestoring }}
							hitSlop={8}
							className={cn('min-h-11 justify-center', isRestoreDisabled && 'opacity-40')}
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
