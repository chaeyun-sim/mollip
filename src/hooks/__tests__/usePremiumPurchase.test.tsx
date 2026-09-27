import { InteractionManager } from 'react-native';
import { act } from 'react';
import { createRoot } from 'test-renderer';
import Purchases, { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { ENTITLEMENT_ID } from '@/src/lib/subscription';
import { usePurchaseLockStore } from '@/src/store/purchaseLockStore';
import { usePurchaseTransactionStore } from '@/src/store/purchaseTransactionStore';
import { usePurchaseOperationStore } from '@/src/store/purchaseOperationStore';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import {
	OFFERINGS_TIMEOUT_MS,
	PACKAGE_IDS,
	PURCHASE_RESULT_PENDING_MESSAGE,
	PURCHASE_WAIT_TIMEOUT_MS,
	usePremiumPurchase,
} from '../usePremiumPurchase';

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

const mockGetOfferings = Purchases.getOfferings as jest.Mock;
const mockPurchasePackage = Purchases.purchasePackage as jest.Mock;
const mockGetCustomerInfo = Purchases.getCustomerInfo as jest.Mock;
const mockRestorePurchases = Purchases.restorePurchases as jest.Mock;
const mockInvalidateCache = Purchases.invalidateCustomerInfoCache as jest.Mock;

function makePackage(identifier: string) {
	return {
		identifier,
		product: {
			priceString: '₩1,000',
			price: 1000,
			currencyCode: 'KRW',
			subscriptionPeriod: 'P1M',
		},
	} as any;
}

function offeringsWith(packages: ReturnType<typeof makePackage>[]) {
	return { current: { availablePackages: packages } } as any;
}

function activeCustomerInfo() {
	return { entitlements: { active: { [ENTITLEMENT_ID]: { productIdentifier: 'x' } } } } as any;
}

function inactiveCustomerInfo() {
	return { entitlements: { active: {} } } as any;
}

type HookResult = ReturnType<typeof usePremiumPurchase>;
const mountedRoots: Array<() => void> = [];

function renderPremiumPurchase(
	overrides: { navigateAway?: jest.Mock; showToast?: jest.Mock } = {},
) {
	const navigateAway = overrides.navigateAway ?? jest.fn();
	const showToast = overrides.showToast ?? jest.fn();
	const hookRef: { current: HookResult | null } = { current: null };

	function Harness() {
		hookRef.current = usePremiumPurchase({ navigateAway, showToast });
		return null;
	}

	const root = createRoot();
	let isUnmounted = false;
	act(() => {
		root.render(<Harness />);
	});
	const unmount = () => {
		if (isUnmounted) return;
		isUnmounted = true;
		root.unmount();
	};
	mountedRoots.push(unmount);

	return {
		hookRef,
		navigateAway,
		showToast,
		unmount,
	};
}

/** pending microtask들을 몇 tick 흘려보내 useEffect/await 체인이 정리되게 한다. */
async function flush() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
	});
}

beforeEach(() => {
	mockGetOfferings.mockReset();
	mockPurchasePackage.mockReset();
	mockGetCustomerInfo.mockReset();
	mockRestorePurchases.mockReset();
	mockInvalidateCache.mockReset().mockResolvedValue(undefined);
	usePurchaseLockStore.setState({ isLocked: false });
	usePurchaseTransactionStore.setState({ isPending: false });
	usePurchaseOperationStore.setState({ operation: null });
	useSubscriptionStore.setState({
		isPremium: false,
		productIdentifier: null,
		expirationDate: null,
		willRenew: false,
	});

	// InteractionManager.runAfterInteractions을 동기 실행으로 대체해 잠금 해제 타이밍을 결정적으로 만든다.
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

async function readyHook(overrides: { navigateAway?: jest.Mock; showToast?: jest.Mock } = {}) {
	mockGetOfferings.mockResolvedValueOnce(offeringsWith([makePackage(PACKAGE_IDS.sixMonths)]));
	const result = renderPremiumPurchase(overrides);
	await flush();
	return result;
}

describe('상품 로딩 — 오프라인/빈 상품/부분 상품/재시도/dedup', () => {
	it('오프라인(네트워크 에러)이면 error 상태가 되고, 상품이 없어 구매 SDK를 절대 호출하지 않는다', async () => {
		mockGetOfferings.mockRejectedValueOnce(new Error('network down'));

		const { hookRef } = renderPremiumPurchase();
		await flush();

		expect(hookRef.current!.loadState).toBe('error');
		expect(hookRef.current!.selectedPackage).toBeUndefined();

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(mockPurchasePackage).not.toHaveBeenCalled();
	});

	it('availablePackages가 비어 있으면 error(가짜 가격 금지)', async () => {
		mockGetOfferings.mockResolvedValueOnce(offeringsWith([]));
		const { hookRef } = renderPremiumPurchase();
		await flush();

		expect(hookRef.current!.loadState).toBe('error');
		expect(hookRef.current!.packages).toHaveLength(0);
	});

	it('가격 문자열이 비어 있는 상품은 목록에서 제외한다(가짜/빈 가격 표시 금지)', async () => {
		const priceless = makePackage(PACKAGE_IDS.sixMonths);
		priceless.product.priceString = '';
		mockGetOfferings.mockResolvedValueOnce(offeringsWith([priceless]));

		const { hookRef } = renderPremiumPurchase();
		await flush();

		expect(hookRef.current!.loadState).toBe('error');
	});

	it('partial 상품에서도 selectedPlan이 실제 존재하는 상품으로 fallback된다', async () => {
		mockGetOfferings.mockResolvedValueOnce(offeringsWith([makePackage(PACKAGE_IDS.monthly)]));
		const { hookRef } = renderPremiumPurchase();
		await flush();

		expect(hookRef.current!.loadState).toBe('ready');
		expect(hookRef.current!.selectedPlan).toBe('monthly');
		expect(hookRef.current!.selectedPackage?.identifier).toBe(PACKAGE_IDS.monthly);
	});

	it('error 상태에서 retry하면 재설치 없이 복구된다', async () => {
		mockGetOfferings.mockRejectedValueOnce(new Error('network down'));
		const { hookRef } = renderPremiumPurchase();
		await flush();
		expect(hookRef.current!.loadState).toBe('error');

		mockGetOfferings.mockResolvedValueOnce(offeringsWith([makePackage(PACKAGE_IDS.sixMonths)]));
		await act(async () => {
			await hookRef.current!.loadOfferings();
		});

		expect(hookRef.current!.loadState).toBe('ready');
	});

	it('진행 중인 로딩이 있으면 재호출은 무시된다(in-flight dedup, 중복 SDK 호출 방지)', async () => {
		let resolveFirst!: (value: unknown) => void;
		mockGetOfferings.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveFirst = resolve;
			}),
		);

		const { hookRef } = renderPremiumPurchase();

		// 최초 마운트 로드가 아직 pending인 상태에서 재호출 — dedup되어 getOfferings가 또 불리지 않는다.
		await act(async () => {
			await hookRef.current!.loadOfferings();
		});
		expect(mockGetOfferings).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveFirst(offeringsWith([makePackage(PACKAGE_IDS.sixMonths)]));
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(hookRef.current!.loadState).toBe('ready');
	});

	it('상품 응답이 지나치게 오래 걸리면(bounded wait) error로 전환되고 UI가 풀린다', async () => {
		jest.useFakeTimers();
		try {
			mockGetOfferings.mockReturnValueOnce(new Promise(() => {})); // 절대 resolve되지 않음

			const { hookRef } = renderPremiumPurchase();

			await act(async () => {
				jest.advanceTimersByTime(OFFERINGS_TIMEOUT_MS);
				await Promise.resolve();
				await Promise.resolve();
				await Promise.resolve();
			});

			expect(hookRef.current!.loadState).toBe('error');
		} finally {
			jest.useRealTimers();
		}
	});

	it('오래된(stale) 응답은 무시하고 최신 요청 결과만 반영한다(race)', async () => {
		let resolveStale!: (value: unknown) => void;
		const stalePromise = new Promise((resolve) => {
			resolveStale = resolve;
		});
		mockGetOfferings.mockReturnValueOnce(stalePromise);

		const { hookRef } = renderPremiumPurchase();

		// stale 요청이 진행 중일 때 dedup에 걸리지 않도록, 먼저 완료시키지 않고 대기시킨 채로 둔 상태에서
		// 언마운트 후 재마운트(새 훅 인스턴스)로 최신 요청을 만든다 — requestId는 훅 인스턴스 경계를 넘지 않으므로
		// 같은 인스턴스 안에서의 race는 위 in-flight dedup 테스트가, 응답 지연 자체의 무시는 아래에서 검증한다.
		await act(async () => {
			resolveStale(offeringsWith([makePackage(PACKAGE_IDS.monthly)]));
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(hookRef.current!.loadState).toBe('ready');
		expect(hookRef.current!.packages.map((p) => p.identifier)).toEqual([PACKAGE_IDS.monthly]);
	});

	it('NET-02: 타임아웃된 이전 요청이 나중에 성공으로 도착해도, 이미 실패한 재시도 결과를 덮어쓰지 않는다', async () => {
		jest.useFakeTimers();
		try {
			let resolveOld!: (value: unknown) => void;
			mockGetOfferings.mockReturnValueOnce(
				new Promise((resolve) => {
					resolveOld = resolve;
				}),
			);

			const { hookRef } = renderPremiumPurchase();

			// 최초 요청(request #1)이 타임아웃으로 error 전환된다 — 네트워크가 끊긴 채 대기 초과.
			await act(async () => {
				jest.advanceTimersByTime(OFFERINGS_TIMEOUT_MS);
				await Promise.resolve();
				await Promise.resolve();
				await Promise.resolve();
			});
			expect(hookRef.current!.loadState).toBe('error');

			// 사용자가 재시도(request #2)하지만 여전히 오프라인이라 다시 실패한다.
			mockGetOfferings.mockRejectedValueOnce(new Error('still offline'));
			await act(async () => {
				await hookRef.current!.loadOfferings();
			});
			expect(hookRef.current!.loadState).toBe('error');
			expect(hookRef.current!.packages).toHaveLength(0);

			// 그런데 request #1의 원래 네이티브 getOfferings 호출이 뒤늦게 "성공"으로 도착한다
			// (Promise.race가 타임아웃으로 먼저 정착됐을 뿐, 실제 네트워크 호출 자체는 계속 살아있었다).
			// 이 지연 성공이 request #2의 실패 상태를 덮어써서는 안 된다.
			await act(async () => {
				resolveOld(offeringsWith([makePackage(PACKAGE_IDS.sixMonths)]));
				await Promise.resolve();
				await Promise.resolve();
			});

			expect(hookRef.current!.loadState).toBe('error');
			expect(hookRef.current!.packages).toHaveLength(0);
		} finally {
			jest.useRealTimers();
		}
	});

	it('NET-02: 이전 요청이 뒤늦게 실패로 도착해도, 이미 성공한 최신 재시도 결과를 error로 덮어쓰지 않는다', async () => {
		jest.useFakeTimers();
		try {
			let rejectOld!: (reason: unknown) => void;
			mockGetOfferings.mockReturnValueOnce(
				new Promise((_, reject) => {
					rejectOld = reject;
				}),
			);

			const { hookRef } = renderPremiumPurchase();

			// request #1이 타임아웃으로 먼저 error 처리된다.
			await act(async () => {
				jest.advanceTimersByTime(OFFERINGS_TIMEOUT_MS);
				await Promise.resolve();
				await Promise.resolve();
				await Promise.resolve();
			});
			expect(hookRef.current!.loadState).toBe('error');

			// 재시도(request #2)는 네트워크가 복구돼 성공한다.
			mockGetOfferings.mockResolvedValueOnce(offeringsWith([makePackage(PACKAGE_IDS.weekly)]));
			await act(async () => {
				await hookRef.current!.loadOfferings();
			});
			expect(hookRef.current!.loadState).toBe('ready');
			expect(hookRef.current!.packages.map((p) => p.identifier)).toEqual([PACKAGE_IDS.weekly]);

			// request #1의 원래 호출이 뒤늦게 거부(reject)로 도착해도 최신 성공 상태를 훼손하지 않는다.
			await act(async () => {
				rejectOld(new Error('request #1 finally failed, very late'));
				await Promise.resolve();
				await Promise.resolve();
			});

			expect(hookRef.current!.loadState).toBe('ready');
			expect(hookRef.current!.packages.map((p) => p.identifier)).toEqual([PACKAGE_IDS.weekly]);
		} finally {
			jest.useRealTimers();
		}
	});

	it('NET-02: loading 상태에서는 구매 SDK가 절대 호출되지 않는다', async () => {
		mockGetOfferings.mockReturnValueOnce(new Promise(() => {})); // 계속 loading 유지
		const { hookRef } = renderPremiumPurchase();
		await flush();

		expect(hookRef.current!.loadState).toBe('loading');

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(mockPurchasePackage).not.toHaveBeenCalled();
	});

	it('NET-02: 재시도 버튼을 동일 틱에 연타해도 상품 조회 SDK는 한 번만 호출된다', async () => {
		mockGetOfferings.mockRejectedValueOnce(new Error('offline'));
		const { hookRef } = renderPremiumPurchase();
		await flush();
		expect(hookRef.current!.loadState).toBe('error');

		let resolveRetry!: (value: unknown) => void;
		mockGetOfferings.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveRetry = resolve;
			}),
		);

		act(() => {
			// await 없이 동일 틱에서 재시도를 두 번 트리거 — in-flight 가드가 두 번째를 무시해야 한다.
			void hookRef.current!.loadOfferings();
			void hookRef.current!.loadOfferings();
		});

		// 마운트 시 자동 호출(1회) + 연타된 재시도 중 dedup으로 살아남은 1회 = 총 2회.
		// 3회가 아니라면 동일 틱 중복 재시도가 정상적으로 차단된 것이다.
		expect(mockGetOfferings).toHaveBeenCalledTimes(2);

		await act(async () => {
			resolveRetry(offeringsWith([makePackage(PACKAGE_IDS.sixMonths)]));
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(hookRef.current!.loadState).toBe('ready');
	});

	it('unmount 이후 도착하는 응답은 어떤 state도 건드리지 않는다(경고 없이 조용히 무시)', async () => {
		let resolveSlow!: (value: unknown) => void;
		mockGetOfferings.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveSlow = resolve;
			}),
		);

		const { hookRef, unmount } = renderPremiumPurchase();

		act(() => {
			unmount();
		});

		// unmount 이후 응답이 도착해도 예외 없이(React act 경고 없이) 처리된다.
		await act(async () => {
			resolveSlow(offeringsWith([makePackage(PACKAGE_IDS.sixMonths)]));
			await Promise.resolve();
			await Promise.resolve();
		});

		// 마지막으로 읽은 값에서 상태가 더 이상 바뀌지 않았어야 한다(loading에서 멈춤).
		expect(hookRef.current!.loadState).toBe('loading');
	});
});

describe('구매 — 동시성/재진입 가드', () => {
	it('동일 틱에 두 번 호출해도(연타) 구매 SDK는 한 번만 호출된다', async () => {
		const { hookRef } = await readyHook();
		let resolvePurchase!: (value: unknown) => void;
		mockPurchasePackage.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePurchase = resolve;
			}),
		);

		let call1: Promise<void>;
		let call2: Promise<void>;
		act(() => {
			// await 없이 같은 동기 틱에서 두 번 호출 — ref 가드가 동작해야 한다.
			call1 = hookRef.current!.handlePurchase();
			call2 = hookRef.current!.handlePurchase();
		});
		// USR-05: pending 표식 저장을 await한 뒤에야 purchasePackage를 호출하므로
		// 마이크로태스크를 한 번 흘려보내야 SDK 호출이 반영된다.
		await flush();

		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolvePurchase({ customerInfo: activeCustomerInfo() });
			await call1;
			await call2;
		});
	});

	it('USR-01: 1초 내 10회 연타와 처리 중 추가 탭에도 purchasePackage는 한 번만 호출된다', async () => {
		const { hookRef } = await readyHook();
		let resolvePurchase!: (value: unknown) => void;
		mockPurchasePackage.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePurchase = resolve;
			}),
		);

		const calls: Promise<void>[] = [];
		act(() => {
			for (let index = 0; index < 10; index += 1) calls.push(hookRef.current!.handlePurchase());
		});
		// USR-05: pending 표식 저장을 await한 뒤에야 purchasePackage를 호출하므로
		// 마이크로태스크를 한 번 흘려보내야 SDK 호출이 반영된다.
		await flush();

		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolvePurchase({ customerInfo: activeCustomerInfo() });
			await Promise.all(calls);
		});
	});

	it('USR-01: 사용자 취소 후에는 잠금이 풀리고 정상적으로 다시 구매할 수 있다', async () => {
		const { hookRef } = await readyHook();
		mockPurchasePackage
			.mockRejectedValueOnce({ userCancelled: true })
			.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(hookRef.current!.purchaseStatus).toBe('idle');

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(mockPurchasePackage).toHaveBeenCalledTimes(2);
	});

	it('USR-02: 구매 시작 시 전달한 package는 처리 중 플랜 변경 시에도 유지된다', async () => {
		const { hookRef } = await readyHook();
		const sixMonths = hookRef.current!.selectedPackage;
		let resolvePurchase!: (value: unknown) => void;
		mockPurchasePackage.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePurchase = resolve;
			}),
		);

		let purchaseCall: Promise<void>;
		act(() => {
			purchaseCall = hookRef.current!.handlePurchase();
		});
		const planBeforeChange = hookRef.current!.selectedPlan;
		// USR-05: pending 표식 저장을 await한 뒤에야 purchasePackage를 호출하므로
		// 마이크로태스크를 한 번 흘려보내야 SDK 호출이 반영된다.
		await flush();

		act(() => {
			hookRef.current!.setSelectedPlan('monthly');
		});

		expect(hookRef.current!.selectedPlan).toBe(planBeforeChange);
		expect(mockPurchasePackage).toHaveBeenCalledWith(sixMonths);

		await act(async () => {
			resolvePurchase({ customerInfo: activeCustomerInfo() });
			await purchaseCall;
		});
	});

	it('구매 진행 중에는 복원(handleRestore)이 무시된다(상호 배타)', async () => {
		const { hookRef } = await readyHook();
		let resolvePurchase!: (value: unknown) => void;
		mockPurchasePackage.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePurchase = resolve;
			}),
		);

		let purchaseCall: Promise<void>;
		act(() => {
			purchaseCall = hookRef.current!.handlePurchase();
		});

		await act(async () => {
			await hookRef.current!.handleRestore();
		});

		expect(mockRestorePurchases).not.toHaveBeenCalled();

		await act(async () => {
			resolvePurchase({ customerInfo: activeCustomerInfo() });
			await purchaseCall;
		});
	});

	it('USR-03: 전역 구매 작업 중 복원은 SDK를 호출하지 않고 안내한다', async () => {
		const { hookRef, showToast } = await readyHook();
		let resolvePurchase!: (value: unknown) => void;
		mockPurchasePackage.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePurchase = resolve;
			}),
		);

		let purchaseCall: Promise<void>;
		act(() => {
			purchaseCall = hookRef.current!.handlePurchase();
		});
		await act(async () => {
			await hookRef.current!.handleRestore();
		});

		expect(mockRestorePurchases).not.toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith('구매 처리 중이에요. 잠시만 기다려 주세요.');

		await act(async () => {
			resolvePurchase({ customerInfo: activeCustomerInfo() });
			await purchaseCall;
		});
	});

	it('USR-03: 전역 복원 작업 중 구매는 SDK를 호출하지 않고 안내한다', async () => {
		const { hookRef, showToast } = await readyHook();
		let resolveRestore!: (value: unknown) => void;
		mockRestorePurchases.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveRestore = resolve;
			}),
		);

		let restoreCall: Promise<void>;
		act(() => {
			restoreCall = hookRef.current!.handleRestore();
		});
		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(mockPurchasePackage).not.toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith('구매 복원 중이에요. 잠시만 기다려 주세요.');

		await act(async () => {
			resolveRestore(inactiveCustomerInfo());
			await restoreCall;
		});
	});

	it('USR-04: Apple 결제창 직접 취소는 오류·성공 이벤트 없이 idle로 복귀하고 재구매를 허용한다', async () => {
		const { hookRef, navigateAway, showToast } = await readyHook();
		mockPurchasePackage
			.mockRejectedValueOnce({ userCancelled: true })
			.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('idle');
		expect(useSubscriptionStore.getState().isPremium).toBe(false);
		expect(usePurchaseTransactionStore.getState().isPending).toBe(false);
		expect(usePurchaseOperationStore.getState().operation).toBeNull();
		expect(navigateAway).not.toHaveBeenCalled();
		expect(showToast).not.toHaveBeenCalled();

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(mockPurchasePackage).toHaveBeenCalledTimes(2);
	});
});

describe('구매 — 성공 시 내비게이션 및 전역 잠금 생애주기', () => {
	it('활성 entitlement 확인 후에만 lock → navigateAway → unlock+완료 토스트(정확히 1회) 순서로 진행된다', async () => {
		mockPurchasePackage.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });

		const navigateAway = jest.fn(() => {
			expect(usePurchaseLockStore.getState().isLocked).toBe(true);
		});
		const { hookRef, showToast } = await readyHook({ navigateAway });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(navigateAway).toHaveBeenCalledTimes(1);
		expect(usePurchaseLockStore.getState().isLocked).toBe(false);
		expect(showToast).toHaveBeenCalledWith('몰립 프리미엄이 시작됐어요!');
		expect(showToast).toHaveBeenCalledTimes(1);
	});

	it('NET-05: 연결 전환으로 성공 확인 경로가 겹쳐도 화면 이동과 성공 토스트는 한 번만 실행된다', async () => {
		const { hookRef, navigateAway, showToast } = await readyHook();
		mockPurchasePackage.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });
		mockGetCustomerInfo.mockResolvedValueOnce(activeCustomerInfo());

		await act(async () => {
			await hookRef.current!.handlePurchase();
			await hookRef.current!.handleCheckPendingStatus();
		});

		expect(navigateAway).toHaveBeenCalledTimes(1);
		expect(showToast).toHaveBeenCalledWith('몰립 프리미엄이 시작됐어요!');
		expect(showToast).toHaveBeenCalledTimes(1);
	});

	it('NET-06: 대기 제한 후 화면을 닫아도 늦은 active entitlement는 store에 반영된다', async () => {
		jest.useFakeTimers();
		const { hookRef, navigateAway, unmount } = await readyHook();
		let resolvePurchase!: (value: { customerInfo: any }) => void;
		mockPurchasePackage.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePurchase = resolve;
			}),
		);

		await act(async () => {
			void hookRef.current!.handlePurchase();
			await Promise.resolve();
		});
		await act(async () => {
			jest.advanceTimersByTime(PURCHASE_WAIT_TIMEOUT_MS);
			await Promise.resolve();
		});

		expect(hookRef.current!.purchaseStatus).toBe('timedOut');
		expect(usePurchaseTransactionStore.getState().isPending).toBe(true);
		expect(navigateAway).not.toHaveBeenCalled();

		await act(async () => {
			unmount();
			resolvePurchase({ customerInfo: activeCustomerInfo() });
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(useSubscriptionStore.getState().isPremium).toBe(true);
		expect(usePurchaseTransactionStore.getState().isPending).toBe(false);
		jest.useRealTimers();
	});

	it('navigateAway가 예외를 던지면 성공 토스트 없이 잠금만 해제되고 안내 메시지가 뜬다(중복 메시지 없음)', async () => {
		mockPurchasePackage.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });
		const navigateAway = jest.fn(() => {
			throw new Error('navigation failed');
		});
		const { hookRef, showToast } = await readyHook({ navigateAway });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(usePurchaseLockStore.getState().isLocked).toBe(false);
		expect(showToast).toHaveBeenCalledTimes(1);
		expect(showToast).not.toHaveBeenCalledWith('몰립 프리미엄이 시작됐어요!');
	});

	it('InteractionManager 콜백이 발화하지 않아도 failsafe 타이머가 잠금을 반드시 해제한다', async () => {
		jest.useFakeTimers();
		try {
			jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(() => {
				// 의도적으로 콜백을 실행하지 않는다(누락 시나리오).
				return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() } as any;
			});
			mockGetOfferings.mockResolvedValueOnce(offeringsWith([makePackage(PACKAGE_IDS.sixMonths)]));
			mockPurchasePackage.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });

			const { hookRef, showToast } = renderPremiumPurchase();
			await act(async () => {
				await Promise.resolve();
				await Promise.resolve();
			});

			await act(async () => {
				await hookRef.current!.handlePurchase();
			});

			expect(usePurchaseLockStore.getState().isLocked).toBe(true); // InteractionManager가 안 불렸으므로 아직 잠김

			await act(async () => {
				jest.advanceTimersByTime(2000);
			});

			expect(usePurchaseLockStore.getState().isLocked).toBe(false);
			expect(showToast).toHaveBeenCalledWith('몰립 프리미엄이 시작됐어요!');
		} finally {
			jest.useRealTimers();
		}
	});

	it('선택된 상품이 없으면 구매 SDK를 호출하지 않는다', async () => {
		mockGetOfferings.mockResolvedValueOnce(offeringsWith([]));
		const { hookRef } = renderPremiumPurchase();
		await flush();

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(mockPurchasePackage).not.toHaveBeenCalled();
	});
});

describe('구매 — 결과가 불확실한 경우(uncertain) — 취소/네트워크/보류/무-entitlement', () => {
	it('취소(userCancelled)는 uncertain으로 전이하지 않고 조용히 idle로 남는다', async () => {
		const { hookRef, navigateAway, showToast } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ userCancelled: true });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('idle');
		expect(showToast).not.toHaveBeenCalled();
		expect(navigateAway).not.toHaveBeenCalled();
	});

	it('NET-04: RevenueCat 통신 단절 결과는 지정 문구와 uncertain 상태로 전이하며 재구매를 막는다', async () => {
		const { hookRef, navigateAway, showToast } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.NETWORK_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('uncertain');
		expect(navigateAway).not.toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith(PURCHASE_RESULT_PENDING_MESSAGE);

		// uncertain 상태에서 구매를 다시 시도해도 SDK가 또 호출되지 않는다(자동/성급한 재구매 금지).
		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);
	});

	it('PAYMENT_PENDING도 uncertain으로 전이한다(성공/실패 단정 금지)', async () => {
		const { hookRef } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('uncertain');
	});

	it('SDK가 예외 없이 반환했지만 entitlement가 비어 있으면 실패로 단정하지 않고 uncertain으로 전이한다', async () => {
		const { hookRef, navigateAway } = await readyHook();
		mockPurchasePackage.mockResolvedValueOnce({ customerInfo: inactiveCustomerInfo() });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('uncertain');
		expect(navigateAway).not.toHaveBeenCalled();
	});

	it('그 외 SDK 오류(예: STORE_PROBLEM)는 uncertain이 아니라 즉시 재시도 가능한 idle로 남는다', async () => {
		const { hookRef, showToast } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('idle');
		expect(showToast).toHaveBeenCalledWith(expect.stringContaining('다시 시도'));
	});

	it('NET-03: OPERATION_ALREADY_IN_PROGRESS도 uncertain으로 전이한다(진행 중인 트랜잭션에 중복 요청 금지)', async () => {
		const { hookRef } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({
			code: PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR,
		});

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('uncertain');

		// uncertain인 동안 재구매 시도는 SDK를 다시 호출하지 않는다 — 진행 중일 수 있는 트랜잭션에 중복 요청 금지.
		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(mockPurchasePackage).toHaveBeenCalledTimes(1);
	});

	it('NET-03: 구매가 불확실(uncertain)한 동안에는 store가 절대 프리미엄으로 표시되지 않는다', async () => {
		const { hookRef } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.NETWORK_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		expect(hookRef.current!.purchaseStatus).toBe('uncertain');
		// 검증된 활성 entitlement 없이는 optimistic하게 프리미엄을 부여하지 않는다.
		expect(useSubscriptionStore.getState().isPremium).toBe(false);
	});

	it('NET-03: 구매가 불확실한 동안에는 복원(handleRestore)도 훅 레벨에서 차단된다', async () => {
		const { hookRef } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(hookRef.current!.purchaseStatus).toBe('uncertain');

		await act(async () => {
			await hookRef.current!.handleRestore();
		});

		expect(mockRestorePurchases).not.toHaveBeenCalled();
	});
});

describe('상태 확인(handleCheckPendingStatus) — uncertain 해소', () => {
	it('캐시를 무효화한 뒤 최신 CustomerInfo를 확인하고, 활성화돼 있으면 성공 경로(잠금+이동+토스트 1회)로 마무리한다', async () => {
		const { hookRef, navigateAway, showToast } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(hookRef.current!.purchaseStatus).toBe('uncertain');

		mockGetCustomerInfo.mockResolvedValueOnce(activeCustomerInfo());

		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});

		expect(mockInvalidateCache).toHaveBeenCalledTimes(1);
		expect(mockGetCustomerInfo).toHaveBeenCalledTimes(1);
		expect(navigateAway).toHaveBeenCalledTimes(1);
		expect(showToast).toHaveBeenCalledWith('몰립 프리미엄이 시작됐어요!');
		expect(hookRef.current!.purchaseStatus).toBe('idle');
		// NET-03: 검증된 활성 entitlement가 확인된 뒤에만 store가 프리미엄으로 반영된다.
		expect(useSubscriptionStore.getState().isPremium).toBe(true);
	});

	it('확인 결과 아직 활성화되지 않았으면 idle로 되돌려 사용자가 다시 시도할 수 있게 한다', async () => {
		const { hookRef, navigateAway } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		mockGetCustomerInfo.mockResolvedValueOnce(inactiveCustomerInfo());

		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});

		expect(hookRef.current!.purchaseStatus).toBe('idle');
		expect(navigateAway).not.toHaveBeenCalled();

		// idle로 돌아왔으니 이제는 재구매 SDK 호출이 다시 허용된다.
		mockPurchasePackage.mockResolvedValueOnce({ customerInfo: activeCustomerInfo() });
		await act(async () => {
			await hookRef.current!.handlePurchase();
		});
		expect(mockPurchasePackage).toHaveBeenCalledTimes(2);
	});

	it('확인 자체가 실패하면 uncertain 상태를 유지한다(재확인 가능)', async () => {
		const { hookRef } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.NETWORK_ERROR });

		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		mockGetCustomerInfo.mockRejectedValueOnce(new Error('still offline'));

		await act(async () => {
			await hookRef.current!.handleCheckPendingStatus();
		});

		expect(hookRef.current!.purchaseStatus).toBe('uncertain');
	});

	it('동일 틱에 두 번 호출해도 상태 확인은 한 번만 실행된다', async () => {
		const { hookRef } = await readyHook();
		mockPurchasePackage.mockRejectedValueOnce({ code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR });
		await act(async () => {
			await hookRef.current!.handlePurchase();
		});

		let resolveCheck!: (value: unknown) => void;
		mockGetCustomerInfo.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveCheck = resolve;
			}),
		);

		let c1: Promise<void>;
		let c2: Promise<void>;
		act(() => {
			c1 = hookRef.current!.handleCheckPendingStatus();
			c2 = hookRef.current!.handleCheckPendingStatus();
		});

		// invalidateCustomerInfoCache의 await를 한 틱 흘려보내 getCustomerInfo 호출까지 진행시킨다.
		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(mockGetCustomerInfo).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveCheck(inactiveCustomerInfo());
			await c1;
			await c2;
		});
	});
});

describe('구매 복원', () => {
	it('복원 성공 시 syncSubscription을 위해 CustomerInfo를 store에 반영한다(엔타이틀먼트 존재)', async () => {
		const { hookRef, showToast } = await readyHook();
		mockRestorePurchases.mockResolvedValueOnce(activeCustomerInfo());

		await act(async () => {
			await hookRef.current!.handleRestore();
		});

		expect(showToast).toHaveBeenCalledWith('구독을 복원했어요!');
	});

	it('복원했지만 활성 구독이 없으면 안내만 하고 store를 비활성으로 반영한다', async () => {
		const { hookRef, showToast } = await readyHook();
		mockRestorePurchases.mockResolvedValueOnce(inactiveCustomerInfo());

		await act(async () => {
			await hookRef.current!.handleRestore();
		});

		expect(showToast).toHaveBeenCalledWith('복원할 프리미엄 구독이 없어요.');
	});

	it('동일 틱에 두 번 호출해도 복원 SDK는 한 번만 호출된다', async () => {
		const { hookRef } = await readyHook();
		let resolveRestore!: (value: unknown) => void;
		mockRestorePurchases.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveRestore = resolve;
			}),
		);

		let r1: Promise<void>;
		let r2: Promise<void>;
		act(() => {
			r1 = hookRef.current!.handleRestore();
			r2 = hookRef.current!.handleRestore();
		});

		expect(mockRestorePurchases).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveRestore(inactiveCustomerInfo());
			await r1;
			await r2;
		});
	});
});
