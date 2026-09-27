import { InteractionManager } from 'react-native';
import { act } from 'react';
import { createRoot } from 'test-renderer';
import Purchases, { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { ENTITLEMENT_ID } from '@/src/lib/subscription';
import {
	clearPendingPurchaseReconciliation,
	markPendingPurchaseReconciliation,
} from '@/src/lib/subscriptionVerification';
import { usePurchaseLockStore } from '@/src/store/purchaseLockStore';
import { usePurchaseOperationStore } from '@/src/store/purchaseOperationStore';
import { usePurchaseTransactionStore } from '@/src/store/purchaseTransactionStore';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import {
	PACKAGE_IDS,
	PURCHASE_NOT_FOUND_MESSAGE,
	PURCHASE_STILL_PROCESSING_MESSAGE,
	PURCHASE_WAIT_TIMEOUT_MS,
	usePremiumPurchase,
} from '../usePremiumPurchase';

// USR-05: 영속 표식 저장을 deferred promise로 제어해 "저장 완료 전/후" 순서를 직접 검증한다.
jest.mock('@/src/lib/subscriptionVerification', () => ({
	markPendingPurchaseReconciliation: jest.fn(),
	clearPendingPurchaseReconciliation: jest.fn(),
	loadPendingPurchaseReconciliation: jest.fn(),
	loadLastOnlineVerifiedAt: jest.fn(),
	markOnlineVerifiedAt: jest.fn(),
	isWithinOfflineAccessWindow: jest.fn(() => false),
}));

jest.mock('react-native-purchases', () => {
	const actual = jest.requireActual('react-native-purchases');
	return {
		__esModule: true,
		PURCHASES_ERROR_CODE: actual.PURCHASES_ERROR_CODE,
		default: {
			getOfferings: jest.fn(),
			purchasePackage: jest.fn(),
			getCustomerInfo: jest.fn(),
			restorePurchases: jest.fn(),
			invalidateCustomerInfoCache: jest.fn(),
		},
	};
});

const mockMark = markPendingPurchaseReconciliation as jest.Mock;
const mockClear = clearPendingPurchaseReconciliation as jest.Mock;
const mockGetOfferings = Purchases.getOfferings as jest.Mock;
const mockPurchasePackage = Purchases.purchasePackage as jest.Mock;
const mockGetCustomerInfo = Purchases.getCustomerInfo as jest.Mock;
const mockInvalidateCache = Purchases.invalidateCustomerInfoCache as jest.Mock;

const SIX_MONTHS = {
	identifier: PACKAGE_IDS.sixMonths,
	product: { priceString: '₩1,000', price: 1000, currencyCode: 'KRW', subscriptionPeriod: 'P6M' },
} as any;

const activeCustomerInfo = (latestPurchaseDateMillis = Date.now()) =>
	({
		entitlements: {
			active: { [ENTITLEMENT_ID]: { productIdentifier: 'x', latestPurchaseDateMillis } },
		},
	}) as any;
const inactiveCustomerInfo = () => ({ entitlements: { active: {} } }) as any;

interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (error: unknown) => void;
}

const deferred = <T,>(): Deferred<T> => {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

const flush = async () => {
	await act(async () => {
		for (let i = 0; i < 5; i += 1) await Promise.resolve();
	});
};

type HookResult = ReturnType<typeof usePremiumPurchase>;
const mountedRoots: Array<() => void> = [];

const renderReadyHook = async () => {
	mockGetOfferings.mockResolvedValueOnce({ current: { availablePackages: [SIX_MONTHS] } });
	const navigateAway = jest.fn();
	const showToast = jest.fn();
	const hookRef: { current: HookResult | null } = { current: null };

	function Harness() {
		hookRef.current = usePremiumPurchase({ navigateAway, showToast });
		return null;
	}

	const root = createRoot();
	act(() => {
		root.render(<Harness />);
	});
	await flush();
	let isUnmounted = false;
	const unmount = () => {
		if (isUnmounted) return;
		isUnmounted = true;
		act(() => root.unmount());
	};
	mountedRoots.push(unmount);
	return { hookRef, navigateAway, showToast, unmount };
};

const transaction = () => usePurchaseTransactionStore.getState();

beforeEach(() => {
	jest.clearAllMocks();
	mockInvalidateCache.mockResolvedValue(undefined);
	mockClear.mockResolvedValue(undefined);
	usePurchaseLockStore.setState({ isLocked: false });
	usePurchaseOperationStore.setState({ operation: null });
	usePurchaseTransactionStore.setState({
		isPending: false,
		pendingSince: null,
		isPurchaseInFlight: false,
		generation: 0,
	});
	useSubscriptionStore.setState({ isPremium: false, lastOnlineVerifiedAt: null });
	jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((cb: any) => {
		cb();
		return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() } as any;
	});
});

afterEach(() => {
	act(() => {
		for (const unmount of mountedRoots.splice(0)) unmount();
	});
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('AC-2/AC-6 — 표식 저장과 SDK 호출 순서', () => {
	it('저장이 끝나기 전에는 SDK를 호출하지 않고, 끝난 뒤에만 한 번 호출한다', async () => {
		const { hookRef } = await renderReadyHook();
		const save = deferred<boolean>();
		mockMark.mockReturnValueOnce(save.promise);
		mockPurchasePackage.mockReturnValueOnce(new Promise(() => {}));

		act(() => {
			void hookRef.current!.handlePurchase();
		});
		await flush();

		expect(mockMark).toHaveBeenCalledTimes(1);
		expect(mockPurchasePackage).not.toHaveBeenCalled();
		// 저장 대기 중에도 화면은 이미 "진행 중"이어야 닫기·스와이프가 막힌다(D6).
		expect(hookRef.current!.isPurchasing).toBe(true);
		expect(transaction().isPending).toBe(true);
		expect(transaction().isPurchaseInFlight).toBe(true);
		// 표식에 기록하는 시각과 메모리 pendingSince가 같아야 자동 해제 판정이 일관된다.
		expect(mockMark).toHaveBeenCalledWith(transaction().pendingSince);

		await act(async () => {
			save.resolve(true);
		});
		await flush();

		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);
		expect(mockPurchasePackage).toHaveBeenCalledWith(SIX_MONTHS);
	});

	it('저장이 실패(false)해도 구매는 막지 않고 SDK를 호출한다(D4)', async () => {
		const { hookRef } = await renderReadyHook();
		mockMark.mockResolvedValueOnce(false);
		mockPurchasePackage.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);
		expect(useSubscriptionStore.getState().isPremium).toBe(true);
		expect(transaction().isPending).toBe(false);
		expect(transaction().isPurchaseInFlight).toBe(false);
	});

	it('저장 단계에서 예외가 나면 SDK를 호출하지 않고 작업 잠금과 진행 상태를 모두 푼다', async () => {
		const { hookRef, showToast } = await renderReadyHook();
		mockMark.mockRejectedValueOnce(new Error('disk full'));

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(mockPurchasePackage).not.toHaveBeenCalled();
		expect(usePurchaseOperationStore.getState().operation).toBeNull();
		expect(transaction().isPurchaseInFlight).toBe(false);
		expect(transaction().isPending).toBe(false);
		expect(hookRef.current!.isPurchasing).toBe(false);
		expect(showToast).toHaveBeenCalledWith('결제 중 문제가 발생했어요. 다시 시도해 주세요.');
	});

	it('저장 대기 중 화면을 떠나면 저장이 끝나도 결제 시트를 띄우지 않고 표식을 되돌린다', async () => {
		const { hookRef, unmount } = await renderReadyHook();
		const save = deferred<boolean>();
		mockMark.mockReturnValueOnce(save.promise);

		act(() => {
			void hookRef.current!.handlePurchase();
		});
		await flush();
		unmount();

		await act(async () => {
			save.resolve(true);
		});
		await flush();

		expect(mockPurchasePackage).not.toHaveBeenCalled();
		expect(mockClear).toHaveBeenCalledTimes(1);
		expect(transaction().isPending).toBe(false);
		expect(transaction().isPurchaseInFlight).toBe(false);
		expect(usePurchaseOperationStore.getState().operation).toBeNull();
	});

	it('저장 대기 중 결제를 다시 눌러도 SDK는 한 번만 호출된다', async () => {
		const { hookRef } = await renderReadyHook();
		const save = deferred<boolean>();
		mockMark.mockReturnValueOnce(save.promise);
		mockPurchasePackage.mockReturnValue(new Promise(() => {}));

		act(() => {
			void hookRef.current!.handlePurchase();
		});
		await flush();
		act(() => {
			void hookRef.current!.handlePurchase();
			void hookRef.current!.handlePurchase();
		});
		await act(async () => {
			save.resolve(true);
		});
		await flush();

		expect(mockMark).toHaveBeenCalledTimes(1);
		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);
	});
});

describe('AC-7 — 진행 중 구매와 상태 확인의 경쟁', () => {
	it('저장 대기 중 상태 확인이 inactive를 받아도 pending·표식을 지우지 않고, 저장 후 구매가 이어진다', async () => {
		const { hookRef, showToast } = await renderReadyHook();
		const save = deferred<boolean>();
		mockMark.mockReturnValueOnce(save.promise);
		mockPurchasePackage.mockReturnValueOnce(new Promise(() => {}));
		mockGetCustomerInfo.mockResolvedValueOnce(inactiveCustomerInfo());

		act(() => {
			void hookRef.current!.handlePurchase();
		});
		await flush();
		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});

		expect(transaction().isPending).toBe(true);
		expect(mockClear).not.toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith(PURCHASE_STILL_PROCESSING_MESSAGE);

		await act(async () => {
			save.resolve(true);
		});
		await flush();
		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);
	});

	it('타임아웃 후 SDK 응답 전 상태 확인이 inactive면 표식을 유지하고, 늦은 성공 응답이 오면 해제된다', async () => {
		jest.useFakeTimers();
		const { hookRef, showToast } = await renderReadyHook();
		mockMark.mockResolvedValueOnce(true);
		const purchase = deferred<{ customerInfo: any }>();
		mockPurchasePackage.mockReturnValueOnce(purchase.promise);

		act(() => {
			void hookRef.current!.handlePurchase();
		});
		await flush();
		await act(async () => {
			jest.advanceTimersByTime(PURCHASE_WAIT_TIMEOUT_MS);
		});
		await flush();
		expect(hookRef.current!.purchaseStatus).toBe('timedOut');
		expect(transaction().isPurchaseInFlight).toBe(true);

		mockGetCustomerInfo.mockResolvedValueOnce(inactiveCustomerInfo());
		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});

		expect(transaction().isPending).toBe(true);
		expect(mockClear).not.toHaveBeenCalled();
		expect(hookRef.current!.purchaseStatus).toBe('timedOut');
		expect(showToast).toHaveBeenCalledWith(PURCHASE_STILL_PROCESSING_MESSAGE);

		await act(async () => {
			purchase.resolve({ customerInfo: activeCustomerInfo() });
		});
		await flush();

		expect(transaction().isPurchaseInFlight).toBe(false);
		expect(transaction().isPending).toBe(false);
		expect(mockClear).toHaveBeenCalledTimes(1);
		expect(useSubscriptionStore.getState().isPremium).toBe(true);
	});

	it('SDK가 동기적으로 던지면 in-flight가 남지 않는다', async () => {
		const { hookRef } = await renderReadyHook();
		mockMark.mockResolvedValueOnce(true);
		mockPurchasePackage.mockImplementationOnce(() => {
			throw { code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR, userCancelled: true };
		});

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(transaction().isPurchaseInFlight).toBe(false);
		expect(transaction().isPending).toBe(false);
	});
});

describe('AC-9 — 재실행 후 남은 pending의 수동 복구', () => {
	const restorePending = (since = 1_000) => {
		usePurchaseTransactionStore.getState().markPending(since);
	};

	it('상태 확인이 활성 구독을 받으면 pending·표식을 해제하고 완료 경로로 간다', async () => {
		restorePending();
		const { hookRef, navigateAway } = await renderReadyHook();
		mockGetCustomerInfo.mockResolvedValueOnce(activeCustomerInfo(500));

		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});

		// 명시 확인은 표식 이전 구매여도 해제한다 — 사용자는 이미 프리미엄이다(01-spec §4.2).
		expect(transaction().isPending).toBe(false);
		expect(mockClear).toHaveBeenCalledTimes(1);
		expect(navigateAway).toHaveBeenCalledTimes(1);
	});

	it('상태 확인이 inactive면 해제하고 재구매를 허용한다', async () => {
		restorePending();
		const { hookRef, showToast } = await renderReadyHook();
		mockGetCustomerInfo.mockResolvedValueOnce(inactiveCustomerInfo());

		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});

		expect(transaction().isPending).toBe(false);
		expect(mockClear).toHaveBeenCalledTimes(1);
		expect(showToast).toHaveBeenCalledWith(PURCHASE_NOT_FOUND_MESSAGE);

		mockMark.mockResolvedValueOnce(true);
		mockPurchasePackage.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });
		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);
	});

	it('상태 확인 자체가 실패하면 pending·표식을 유지하고, 다시 확인해 성공하면 해제된다', async () => {
		restorePending();
		const { hookRef } = await renderReadyHook();
		mockGetCustomerInfo.mockRejectedValueOnce(new Error('offline'));

		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});
		expect(transaction().isPending).toBe(true);
		expect(mockClear).not.toHaveBeenCalled();

		// pending이 남아 있는 동안 결제는 SDK를 호출하지 않는다.
		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(mockPurchasePackage).not.toHaveBeenCalled();

		mockGetCustomerInfo.mockResolvedValueOnce(activeCustomerInfo());
		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});
		expect(transaction().isPending).toBe(false);
		expect(mockClear).toHaveBeenCalledTimes(1);
	});

	it('조회 도중 새 pending이 시작되면 inactive 결과로 그 pending을 지우지 않는다', async () => {
		restorePending();
		const { hookRef, showToast } = await renderReadyHook();
		const info = deferred<any>();
		mockGetCustomerInfo.mockReturnValueOnce(info.promise);

		act(() => {
			void hookRef.current!.handleCheckPendingStatus();
		});
		await flush();
		act(() => {
			usePurchaseTransactionStore.getState().markPending(2_000);
		});
		await act(async () => {
			info.resolve(inactiveCustomerInfo());
		});
		await flush();

		expect(transaction().isPending).toBe(true);
		expect(transaction().pendingSince).toBe(2_000);
		expect(mockClear).not.toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith(PURCHASE_STILL_PROCESSING_MESSAGE);
	});
});
