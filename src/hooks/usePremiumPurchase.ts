import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { useShallow } from 'zustand/react/shallow';
import i18n from '@/src/i18n';
import { ENTITLEMENT_ID, syncSubscription } from '@/src/lib/subscription';
import { classifyPurchaseError } from '@/src/lib/purchaseErrors';
import { usePurchaseLockStore } from '@/src/store/purchaseLockStore';
import { usePurchaseTransactionStore } from '@/src/store/purchaseTransactionStore';
import { usePurchaseOperationStore } from '@/src/store/purchaseOperationStore';
import { toNetworkUnavailableMessage } from '@/src/lib/networkErrors';
import {
	clearPendingPurchaseReconciliation,
	markPendingPurchaseReconciliation,
} from '@/src/lib/subscriptionVerification';

export type PlanId = 'weekly' | 'monthly' | 'sixMonths';
export type LoadState = 'loading' | 'error' | 'ready';
/** idle: 평소 상태. uncertain: 결제 SDK가 성공/실패를 단정할 수 없는 결과를 반환해
 *  서버 CustomerInfo로 재확인하기 전까지는 재구매를 허용하지 않는 상태. */
export type PurchaseUiStatus = 'idle' | 'uncertain' | 'timedOut';

export const PACKAGE_IDS: Record<PlanId, string> = {
	weekly: '$rc_weekly',
	monthly: '$rc_monthly',
	sixMonths: '$rc_six_month',
};

const SUPPORTED_PACKAGE_IDS = new Set(Object.values(PACKAGE_IDS));
export const PLAN_ORDER: PlanId[] = ['sixMonths', 'weekly', 'monthly'];

export const OFFERINGS_TIMEOUT_MS = 10000;
// 토스트 문구는 i18n 키로 두고, 띄우는 시점의 언어로 번역한다
export const PURCHASE_RESULT_PENDING_MESSAGE_KEY = 'premium.result_pending';
export const PURCHASE_WAIT_TIMEOUT_MS = 15000;
/** 상태 확인 시 SDK 구매 응답이 아직 오지 않아 판단을 보류할 때. */
export const PURCHASE_STILL_PROCESSING_MESSAGE_KEY = 'premium.still_processing';
/** 명시 확인 결과 활성 구독이 없어 pending을 해제했을 때 — 늦은 승인 가능성이 있어 단정하지 않는다. */
export const PURCHASE_NOT_FOUND_MESSAGE_KEY = 'premium.not_found';

/** InteractionManager 콜백이 어떤 이유로든 발화하지 않을 때의 안전망(failsafe) 상한.
 *  정상 경로에서는 InteractionManager가 먼저 실행되므로 이 타이머는 보통 취소된다 —
 *  화면 표시를 위해 일부러 넣는 지연이 아니라 정리 보장을 위한 상한선이다. */
const COMPLETE_TRANSITION_FAILSAFE_MS = 1500;

interface UsePremiumPurchaseOptions {
	/** 검증된 활성 구독 확인 직후 화면을 닫는 동작 — router.back() 등 네비게이션은 화면(app/)의 책임이다. */
	navigateAway: () => void;
	showToast: (message: string) => void;
}

/**
 * 프리미엄 화면의 상품 로딩/구매 상태 기계.
 * UI 렌더링과 분리해 순수 로직만 담아 훅 단위로 검증 가능하게 한다 (component-convention §4).
 */
export function usePremiumPurchase({ navigateAway, showToast }: UsePremiumPurchaseOptions) {
	const [selectedPlan, setSelectedPlan] = useState<PlanId>('sixMonths');
	const [packages, setPackages] = useState<PurchasesPackage[]>([]);
	const [loadState, setLoadState] = useState<LoadState>('loading');
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);
	const [isCheckingStatus, setIsCheckingStatus] = useState(false);
	const [purchaseStatus, setPurchaseStatus] = useState<PurchaseUiStatus>('idle');

	const { lock: lockPurchase, unlock: unlockPurchase } = usePurchaseLockStore(
		useShallow((s) => ({ lock: s.lock, unlock: s.unlock })),
	);
	const {
		isPendingTransaction,
		isPurchaseInFlight,
		markPendingTransaction,
		clearPendingTransaction,
		setPurchaseInFlight,
	} = usePurchaseTransactionStore(
		useShallow((s) => ({
			isPendingTransaction: s.isPending,
			isPurchaseInFlight: s.isPurchaseInFlight,
			markPendingTransaction: s.markPending,
			clearPendingTransaction: s.clearPending,
			setPurchaseInFlight: s.setPurchaseInFlight,
		})),
	);
	const { currentOperation, acquireOperation, releaseOperation } = usePurchaseOperationStore(
		useShallow((s) => ({
			currentOperation: s.operation,
			acquireOperation: s.acquire,
			releaseOperation: s.release,
		})),
	);

	// 컴포넌트가 unmount된 뒤에는 어떤 비동기 응답도 로컬 state를 건드리지 않게 막는다.
	const isMountedRef = useRef(true);
	useEffect(
		() => () => {
			isMountedRef.current = false;
			clearTimeout(offeringsTimeoutRef.current);
			clearTimeout(purchaseTimeoutRef.current);
		},
		[],
	);

	// 화면이 재마운트되거나 재시도 버튼이 연타되어도, 가장 마지막 요청의 응답만 반영한다.
	const requestIdRef = useRef(0);
	// getOfferings가 아직 진행 중이면 재시도 탭을 무시해 중복 네트워크 호출을 만들지 않는다.
	const loadInFlightRef = useRef(false);
	const offeringsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	// 동일 틱(await 이전)에 두 번 눌려도 구매 SDK가 두 번 호출되지 않게 막는 동기 가드.
	const purchaseOpRef = useRef(false);
	const restoreOpRef = useRef(false);
	const statusCheckOpRef = useRef(false);
	// 연결 전환 중 늦게 도착한 응답이 현재 구매 시도를 덮어쓰지 않도록 시도 세대를 기록한다.
	const purchaseAttemptIdRef = useRef(0);
	const purchaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	// 구매 결과 확인 경로(purchasePackage/status check)가 겹쳐도 성공 후 이동·토스트는 한 번만 실행한다.
	const completionStartedRef = useRef(false);
	const purchaseResultHandledRef = useRef(false);

	const loadOfferings = useCallback(async () => {
		if (loadInFlightRef.current) return;
		loadInFlightRef.current = true;

		const requestId = ++requestIdRef.current;
		setLoadState('loading');

		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		try {
			const offerings = await Promise.race([
				Purchases.getOfferings(),
				new Promise<never>((_, reject) => {
					timeoutId = setTimeout(
						() => reject(new Error('offerings_timeout')),
						OFFERINGS_TIMEOUT_MS,
					);
					offeringsTimeoutRef.current = timeoutId;
				}),
			]);

			if (requestIdRef.current !== requestId || !isMountedRef.current) return; // stale 응답이거나 이미 unmount됨

			const current = offerings.current;
			// 지원하는 플랜 식별자이면서, 가격 문자열이 실제로 채워진(빈 값이 아닌) 상품만 인정한다.
			const supported = (current?.availablePackages ?? []).filter(
				(pkg) => SUPPORTED_PACKAGE_IDS.has(pkg.identifier) && !!pkg.product?.priceString,
			);

			if (supported.length === 0) {
				console.error('사용 가능한 RevenueCat 상품이 없습니다(또는 가격 정보가 비어 있습니다).');
				setLoadState('error');
				return;
			}

			setPackages(supported);
			setLoadState('ready');
			setSelectedPlan((prev) => {
				const stillAvailable = supported.some((pkg) => pkg.identifier === PACKAGE_IDS[prev]);
				if (stillAvailable) return prev;
				const fallback = PLAN_ORDER.find((id) =>
					supported.some((pkg) => pkg.identifier === PACKAGE_IDS[id]),
				);
				return fallback ?? prev;
			});
		} catch (error) {
			if (requestIdRef.current !== requestId || !isMountedRef.current) return;
			console.error('RevenueCat Offering 조회 실패:', error);
			setLoadState('error');
		} finally {
			clearTimeout(timeoutId);
			if (offeringsTimeoutRef.current === timeoutId) offeringsTimeoutRef.current = undefined;
			loadInFlightRef.current = false;
		}
	}, []);

	useEffect(() => {
		void loadOfferings();
	}, [loadOfferings]);

	const selectedPackage = packages.find((pkg) => pkg.identifier === PACKAGE_IDS[selectedPlan]);
	const selectPlan = useCallback(
		(planId: PlanId) => {
			// UI disabled만으로는 자동화/접근성 이벤트를 완전히 막을 수 없다.
			// 구매가 시작된 뒤에는 호출 시점에 고정한 package와 화면 선택을 모두 유지한다.
			if (
				purchaseOpRef.current ||
				restoreOpRef.current ||
				isPendingTransaction ||
				purchaseStatus !== 'idle'
			) {
				return;
			}
			setSelectedPlan(planId);
		},
		[isPendingTransaction, purchaseStatus],
	);

	/**
	 * 검증된 활성 구독을 확인한 직후에만 호출 — 전역 잠금을 건 채 화면을 닫고 전환을 마무리한다.
	 * InteractionManager 콜백이 실행되지 않는 예외적인 경우에도 failsafe 타이머가 반드시 잠금을 해제한다.
	 * 완료 토스트는 "정상적으로 닫힘"이 확인된 경로에서만, 정확히 한 번 뜬다.
	 */
	const completePurchaseAndClose = useCallback(() => {
		if (completionStartedRef.current) return;
		completionStartedRef.current = true;
		lockPurchase();
		setPurchaseStatus('idle');

		let settled = false;
		const finishOnce = (message: string | null) => {
			if (settled) return;
			settled = true;
			unlockPurchase();
			if (message) showToast(message);
		};

		const failsafeId = setTimeout(
			() => finishOnce(i18n.t('premium.started')),
			COMPLETE_TRANSITION_FAILSAFE_MS,
		);

		try {
			navigateAway();
		} catch (navError) {
			// 화면 전환 자체가 실패했다 — 성공 토스트를 띄우면 안 되고, 잠금도 즉시 풀어 사용자가 갇히지 않게 한다.
			console.error('구매 완료 후 화면 전환 실패:', navError);
			clearTimeout(failsafeId);
			finishOnce(i18n.t('premium.completed_nav_error'));
			return;
		}

		InteractionManager.runAfterInteractions(() => {
			clearTimeout(failsafeId);
			finishOnce(i18n.t('premium.started'));
		});
	}, [lockPurchase, navigateAway, showToast, unlockPurchase]);

	const enterUncertainStatus = useCallback(
		(message: string) => {
			setPurchaseStatus('uncertain');
			showToast(message);
		},
		[showToast],
	);

	const handlePurchase = useCallback(async () => {
		if (purchaseOpRef.current) return;
		if (restoreOpRef.current || currentOperation === 'restore') {
			showToast(i18n.t('premium.restoring'));
			return;
		}
		if (
			loadState !== 'ready' ||
			!selectedPackage ||
			purchaseStatus !== 'idle' ||
			isPendingTransaction
		)
			return;
		if (!acquireOperation('purchase')) {
			showToast(i18n.t('premium.purchasing'));
			return;
		}

		purchaseOpRef.current = true;
		const attemptId = ++purchaseAttemptIdRef.current;
		completionStartedRef.current = false;
		purchaseResultHandledRef.current = false;
		// USR-05 D6: 표식 저장을 기다리는 동안에도 닫기·스와이프·다른 작업을 막아야 하므로
		// 저장 전에 진행 중 상태로 전환한다.
		setIsPurchasing(true);
		const pendingSince = Date.now();
		markPendingTransaction(pendingSince);
		// USR-05 D7: SDK 응답이 settle될 때까지 "진행 중 구매"로 표시해, 상태 확인·자동
		// 재조회가 이 구매의 pending을 inactive 결과로 지우지 못하게 한다.
		setPurchaseInFlight(true);

		const handlePurchaseResult = (
			customerInfo: Awaited<ReturnType<typeof Purchases.purchasePackage>>['customerInfo'],
		) => {
			if (purchaseResultHandledRef.current || purchaseAttemptIdRef.current !== attemptId) return;
			purchaseResultHandledRef.current = true;

			if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
				syncSubscription(customerInfo);
				clearPendingTransaction();
				void clearPendingPurchaseReconciliation();
				if (isMountedRef.current) {
					setPurchaseStatus('idle');
					completePurchaseAndClose();
					return;
				}
				return;
			}

			if (isMountedRef.current) enterUncertainStatus(i18n.t(PURCHASE_RESULT_PENDING_MESSAGE_KEY));
		};

		const handlePurchaseFailure = (error: unknown) => {
			if (purchaseResultHandledRef.current || purchaseAttemptIdRef.current !== attemptId) return;
			purchaseResultHandledRef.current = true;
			const kind = classifyPurchaseError(error);

			if (kind === 'cancelled' || kind === 'other') {
				clearPendingTransaction();
				void clearPendingPurchaseReconciliation();
				if (isMountedRef.current) {
					setPurchaseStatus('idle');
					if (kind === 'other') showToast(i18n.t('premium.purchase_failed'));
				}
				return;
			}

			if (isMountedRef.current) {
				enterUncertainStatus(
					kind === 'network'
						? i18n.t(PURCHASE_RESULT_PENDING_MESSAGE_KEY)
						: i18n.t('premium.purchase_in_progress'),
				);
			}
		};

		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		try {
			// USR-05 D1: 영속 표식 저장이 끝난 뒤에만 SDK를 호출한다 — 그래야 결제 시트가 뜬 이후의
			// 강제 종료가 전부 재실행 시 재확인 대상이 된다. 저장이 실패해도 구매는 막지 않는다(D4).
			await markPendingPurchaseReconciliation(pendingSince);

			// USR-05 D6: 저장을 기다리는 사이 화면이 사라졌으면 결제 시트를 띄우지 않는다.
			// SDK를 호출하지 않았으므로 거래가 존재할 수 없어 표식도 되돌린다.
			if (!isMountedRef.current) {
				setPurchaseInFlight(false);
				clearPendingTransaction();
				void clearPendingPurchaseReconciliation();
				return;
			}

			const purchasePromise = Purchases.purchasePackage(selectedPackage);
			purchasePromise.then(
				({ customerInfo }) => {
					setPurchaseInFlight(false);
					handlePurchaseResult(customerInfo);
				},
				(error: unknown) => {
					setPurchaseInFlight(false);
					handlePurchaseFailure(error);
				},
			);

			const timeout = new Promise<'timedOut'>((resolve) => {
				timeoutId = setTimeout(() => resolve('timedOut'), PURCHASE_WAIT_TIMEOUT_MS);
				purchaseTimeoutRef.current = timeoutId;
			});
			const outcome = await Promise.race([
				purchasePromise.then(() => 'resolved' as const),
				timeout,
			]);

			if (outcome === 'timedOut' && !purchaseResultHandledRef.current && isMountedRef.current) {
				setPurchaseStatus('timedOut');
				showToast(i18n.t(PURCHASE_RESULT_PENDING_MESSAGE_KEY));
			}
		} catch (error) {
			// 여기에 오는 경우는 SDK 호출 전 예외, 동기 throw, 또는 SDK 거부(이미 settle)뿐이다.
			setPurchaseInFlight(false);
			handlePurchaseFailure(error);
		} finally {
			if (typeof timeoutId !== 'undefined') clearTimeout(timeoutId);
			if (purchaseTimeoutRef.current === timeoutId) purchaseTimeoutRef.current = undefined;
			releaseOperation('purchase');
			purchaseOpRef.current = false;
			if (isMountedRef.current) setIsPurchasing(false);
		}
	}, [
		clearPendingTransaction,
		completePurchaseAndClose,
		enterUncertainStatus,
		isPendingTransaction,
		loadState,
		markPendingTransaction,
		acquireOperation,
		currentOperation,
		purchaseStatus,
		releaseOperation,
		selectedPackage,
		setPurchaseInFlight,
		showToast,
	]);

	/** uncertain 상태에서 사용자가 명시적으로 호출하는 읽기 전용 상태 확인 — 자동 재구매는 하지 않는다. */
	const handleCheckPendingStatus = useCallback(async () => {
		if (statusCheckOpRef.current) return;
		statusCheckOpRef.current = true;
		setIsCheckingStatus(true);
		// 조회 도중 새 구매가 시작되면 그 구매의 pending을 이 조회 결과로 지우지 않기 위한 기준값.
		const expectedGeneration = usePurchaseTransactionStore.getState().generation;

		try {
			// 캐시된 값이 아니라 서버의 최신 상태를 확인한다.
			await Purchases.invalidateCustomerInfoCache();
			const customerInfo = await Purchases.getCustomerInfo();
			syncSubscription(customerInfo);

			if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
				clearPendingTransaction();
				void clearPendingPurchaseReconciliation();
				if (isMountedRef.current) setPurchaseStatus('idle');
				completePurchaseAndClose();
				return;
			}

			// USR-05 D7: SDK 구매 응답이 아직 오지 않았다면 inactive는 "실패"가 아니라 "아직 모름"이다 —
			// 표식을 지우면 이후 강제 종료 시 재확인 대상에서 빠지므로 유지한다.
			const transaction = usePurchaseTransactionStore.getState();
			if (transaction.isPurchaseInFlight || transaction.generation !== expectedGeneration) {
				if (isMountedRef.current) {
					showToast(i18n.t(PURCHASE_STILL_PROCESSING_MESSAGE_KEY));
				}
				return;
			}
			clearPendingTransaction();

			// 사용자가 명시적으로 확인한 결과 아직 활성화되지 않았다 — 이제야 재시도를 허용한다.
			// (늦게 승인되면 전역 CustomerInfo 리스너가 권한을 반영한다.)
			void clearPendingPurchaseReconciliation();
			if (isMountedRef.current) {
				setPurchaseStatus('idle');
				showToast(i18n.t(PURCHASE_NOT_FOUND_MESSAGE_KEY));
			}
		} catch (error) {
			console.error('결제 상태 확인 실패:', error);
			if (isMountedRef.current) showToast(toNetworkUnavailableMessage(error));
			// 확인 자체가 실패했으므로 uncertain 상태를 유지한다 — 재확인 버튼으로 다시 시도할 수 있다.
		} finally {
			statusCheckOpRef.current = false;
			if (isMountedRef.current) setIsCheckingStatus(false);
		}
	}, [clearPendingTransaction, completePurchaseAndClose, showToast]);

	const handleRestore = useCallback(async () => {
		if (restoreOpRef.current) return;
		if (purchaseOpRef.current || currentOperation === 'purchase') {
			showToast(i18n.t('premium.purchasing'));
			return;
		}
		if (purchaseStatus !== 'idle' || isPendingTransaction) return;
		if (!acquireOperation('restore')) {
			showToast(i18n.t('premium.restoring'));
			return;
		}
		restoreOpRef.current = true;
		setIsRestoring(true);

		try {
			const customerInfo = await Purchases.restorePurchases();
			syncSubscription(customerInfo);

			const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

			if (!entitlement) {
				showToast(i18n.t('premium.restore_none'));
				return;
			}

			showToast(i18n.t('premium.restore_done'));
		} catch (error) {
			console.error('RevenueCat 구매 복원 실패:', error);
			showToast(i18n.t('premium.restore_failed'));
		} finally {
			releaseOperation('restore');
			restoreOpRef.current = false;
			if (isMountedRef.current) setIsRestoring(false);
		}
	}, [
		acquireOperation,
		currentOperation,
		isPendingTransaction,
		purchaseStatus,
		releaseOperation,
		showToast,
	]);

	return {
		selectedPlan,
		setSelectedPlan: selectPlan,
		packages,
		loadState,
		isPurchasing,
		isRestoring,
		isCheckingStatus,
		purchaseStatus,
		// USR-05 D2: 재실행 후 자동 재확인이 실패해도 이 값이 남아 있으면 화면이 침묵하지
		// 않고 재확인 UI를 보여줄 수 있어야 한다 — purchaseStatus(로컬, 재실행 시 idle로
		// 초기화됨)만으로는 이 상태를 표현할 수 없다.
		isPendingTransaction,
		// USR-05 D7: 진행 중 구매의 pending과 재실행 후 남은 pending을 화면이 구분하는 데 쓴다.
		isPurchaseInFlight,
		selectedPackage,
		loadOfferings,
		handlePurchase,
		handleCheckPendingStatus,
		handleRestore,
	};
}
