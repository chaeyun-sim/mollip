import { ENTITLEMENT_ID } from '@/src/lib/subscription';
import {
	clearPendingPurchaseReconciliation,
	loadPendingPurchaseReconciliation,
} from '@/src/lib/subscriptionVerification';
import { usePurchaseTransactionStore } from '@/src/store/purchaseTransactionStore';
import {
	hasEntitlementPurchasedSince,
	restorePendingReconciliation,
	settlePendingIfConfirmed,
} from '../purchaseReconciliation';

jest.mock('@/src/lib/subscriptionVerification', () => ({
	loadPendingPurchaseReconciliation: jest.fn(),
	clearPendingPurchaseReconciliation: jest.fn(),
	isWithinOfflineAccessWindow: jest.fn(() => false),
}));

const mockLoad = loadPendingPurchaseReconciliation as jest.Mock;
const mockClear = clearPendingPurchaseReconciliation as jest.Mock;

const active = (latestPurchaseDateMillis: number) =>
	({
		entitlements: {
			active: { [ENTITLEMENT_ID]: { productIdentifier: 'x', latestPurchaseDateMillis } },
		},
	}) as any;
const inactive = () => ({ entitlements: { active: {} } }) as any;

const state = () => usePurchaseTransactionStore.getState();

beforeEach(() => {
	jest.clearAllMocks();
	mockClear.mockResolvedValue(undefined);
	usePurchaseTransactionStore.setState({
		isPending: false,
		pendingSince: null,
		isPurchaseInFlight: false,
		generation: 0,
	});
});

describe('restorePendingReconciliation — 재실행 시 표식 복원', () => {
	it('표식이 없으면 메모리 상태를 건드리지 않는다', async () => {
		mockLoad.mockResolvedValueOnce(null);
		await expect(restorePendingReconciliation()).resolves.toBeNull();
		expect(state().isPending).toBe(false);
		expect(state().generation).toBe(0);
	});

	it('표식이 있으면 기록 시각과 함께 pending을 복원하고 generation을 돌려준다', async () => {
		mockLoad.mockResolvedValueOnce(1_000);
		const generation = await restorePendingReconciliation();
		expect(generation).toBe(1);
		expect(state()).toMatchObject({ isPending: true, pendingSince: 1_000, generation: 1 });
	});
});

describe('hasEntitlementPurchasedSince', () => {
	it('표식 이후 구매만 인정한다', () => {
		expect(hasEntitlementPurchasedSince(active(1_000), 1_000)).toBe(true);
		expect(hasEntitlementPurchasedSince(active(999), 1_000)).toBe(false);
		expect(hasEntitlementPurchasedSince(inactive(), 1_000)).toBe(false);
	});

	it('구버전 표식(기록 시각 0)은 어떤 active entitlement도 인정한다', () => {
		expect(hasEntitlementPurchasedSince(active(1), 0)).toBe(true);
	});
});

describe('settlePendingIfConfirmed — 자동 경로 해제 규칙 (AC-5, AC-8, AC-9)', () => {
	it('표식 이후 구매된 active면 메모리와 표식을 모두 해제한다', async () => {
		const generation = state().markPending(1_000);
		await expect(settlePendingIfConfirmed(active(2_000), generation)).resolves.toBe(true);
		expect(state().isPending).toBe(false);
		expect(mockClear).toHaveBeenCalledTimes(1);
	});

	it('조기 inactive로는 해제하지 않는다 (D9)', async () => {
		const generation = state().markPending(1_000);
		await expect(settlePendingIfConfirmed(inactive(), generation)).resolves.toBe(false);
		expect(state().isPending).toBe(true);
		expect(mockClear).not.toHaveBeenCalled();
	});

	it('표식 이전에 구매된 오래된 entitlement로는 새 구매의 pending을 지우지 않는다 (D8)', async () => {
		const generation = state().markPending(5_000);
		await expect(settlePendingIfConfirmed(active(1_000), generation)).resolves.toBe(false);
		expect(state().isPending).toBe(true);
		expect(mockClear).not.toHaveBeenCalled();
	});

	it('구매가 진행 중(in-flight)이면 새 entitlement여도 소유자에게 맡기고 해제하지 않는다 (D8)', async () => {
		const generation = state().markPending(1_000);
		state().setPurchaseInFlight(true);
		await expect(settlePendingIfConfirmed(active(2_000), generation)).resolves.toBe(false);
		expect(state().isPending).toBe(true);
		expect(mockClear).not.toHaveBeenCalled();
	});

	it('재조회 도중 새 구매가 시작되면(generation 변경) 해제하지 않는다 (D8)', async () => {
		const generationAtFetchStart = state().markPending(1_000);
		state().markPending(3_000);
		await expect(settlePendingIfConfirmed(active(2_000), generationAtFetchStart)).resolves.toBe(
			false,
		);
		expect(state()).toMatchObject({ isPending: true, pendingSince: 3_000 });
		expect(mockClear).not.toHaveBeenCalled();
	});

	it('pending이 없으면 아무것도 하지 않는다', async () => {
		await expect(settlePendingIfConfirmed(active(2_000), 0)).resolves.toBe(false);
		expect(mockClear).not.toHaveBeenCalled();
	});
});

describe('통합 — 재실행 후 조기 inactive, 이어서 늦은 승인', () => {
	it('부트스트랩이 inactive를 받으면 유지되고, 이후 리스너가 새 entitlement를 받으면 해제된다', async () => {
		mockLoad.mockResolvedValueOnce(1_000);
		const restored = await restorePendingReconciliation();

		// 부트스트랩 재조회: 조기 inactive
		await settlePendingIfConfirmed(inactive(), restored!);
		expect(state().isPending).toBe(true);

		// 포그라운드 재조회: 여전히 반영 전
		await settlePendingIfConfirmed(inactive(), state().generation);
		expect(state().isPending).toBe(true);
		expect(mockClear).not.toHaveBeenCalled();

		// 늦게 도착한 CustomerInfo 리스너 이벤트
		await settlePendingIfConfirmed(active(1_500), state().generation);
		expect(state().isPending).toBe(false);
		expect(mockClear).toHaveBeenCalledTimes(1);
	});
});
