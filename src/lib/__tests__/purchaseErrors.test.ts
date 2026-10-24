import { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { classifyPurchaseError } from '../purchaseErrors';

describe('classifyPurchaseError', () => {
	it('userCancelled 플래그를 취소로 분류한다', () => {
		expect(classifyPurchaseError({ userCancelled: true })).toBe('cancelled');
	});
	it('PURCHASE_CANCELLED_ERROR 코드를 취소로 분류한다', () => {
		expect(classifyPurchaseError({ code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR })).toBe(
			'cancelled',
		);
	});
	it('NETWORK_ERROR / OFFLINE_CONNECTION_ERROR / 타임아웃을 네트워크로 분류한다', () => {
		expect(classifyPurchaseError({ code: PURCHASES_ERROR_CODE.NETWORK_ERROR })).toBe('network');
		expect(classifyPurchaseError({ code: PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR })).toBe(
			'network',
		);
		expect(
			classifyPurchaseError({ code: PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR }),
		).toBe('network');
	});
	it('PAYMENT_PENDING_ERROR / OPERATION_ALREADY_IN_PROGRESS_ERROR를 pending(불확실)으로 분류한다', () => {
		expect(classifyPurchaseError({ code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR })).toBe(
			'pending',
		);
		expect(
			classifyPurchaseError({ code: PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR }),
		).toBe('pending');
	});
	it('그 외 코드/일반 Error/undefined는 other로 분류한다', () => {
		expect(classifyPurchaseError({ code: PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR })).toBe('other');
		expect(classifyPurchaseError(new Error('boom'))).toBe('other');
		expect(classifyPurchaseError(undefined)).toBe('other');
	});
});
