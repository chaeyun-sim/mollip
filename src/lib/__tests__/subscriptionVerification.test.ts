import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import {
	clearPendingPurchaseReconciliation,
	loadPendingPurchaseReconciliation,
	markPendingPurchaseReconciliation,
} from '../subscriptionVerification';

jest.mock('@react-native-async-storage/async-storage', () =>
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@sentry/react-native', () => ({ addBreadcrumb: jest.fn() }));

const KEY = '@mollip/subscription/pending-purchase-reconciliation';

beforeEach(async () => {
	jest.clearAllMocks();
	await AsyncStorage.clear();
	jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('pending 표식 저장·조회 (USR-05)', () => {
	it('표식에 기록 시각을 저장하고 그대로 읽어온다', async () => {
		await expect(markPendingPurchaseReconciliation(1_234)).resolves.toBe(true);
		expect(await AsyncStorage.getItem(KEY)).toBe('1234');
		await expect(loadPendingPurchaseReconciliation()).resolves.toBe(1_234);
	});

	it('표식이 없으면 null', async () => {
		await expect(loadPendingPurchaseReconciliation()).resolves.toBeNull();
	});

	it('구버전 값 "1"은 기록 시각 0으로 해석한다', async () => {
		await AsyncStorage.setItem(KEY, '1');
		await expect(loadPendingPurchaseReconciliation()).resolves.toBe(0);
	});

	it('삭제하면 다시 null이 된다', async () => {
		await markPendingPurchaseReconciliation(1_234);
		await clearPendingPurchaseReconciliation();
		await expect(loadPendingPurchaseReconciliation()).resolves.toBeNull();
	});
});

describe('저장 실패 — 구매를 막지 않되 관측 가능해야 한다 (AC-3)', () => {
	it('저장 실패 시 false를 반환하고 breadcrumb을 남기며 예외를 던지지 않는다', async () => {
		jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

		await expect(markPendingPurchaseReconciliation(1_234)).resolves.toBe(false);
		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
			expect.objectContaining({
				category: 'purchase.pending-reconciliation',
				level: 'warning',
				data: { error: 'disk full' },
			}),
		);
	});

	it('삭제 실패도 breadcrumb만 남기고 예외를 던지지 않는다', async () => {
		jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('io'));

		await expect(clearPendingPurchaseReconciliation()).resolves.toBeUndefined();
		expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
	});

	it('조회 실패 시 null(표식 없음으로 취급)을 반환한다', async () => {
		jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('io'));
		await expect(loadPendingPurchaseReconciliation()).resolves.toBeNull();
	});
});
