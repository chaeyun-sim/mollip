import { PURCHASES_ERROR_CODE } from 'react-native-purchases';

export type PurchaseErrorKind = 'cancelled' | 'network' | 'pending' | 'other';

interface PurchaseErrorLike {
	code?: PURCHASES_ERROR_CODE;
	userCancelled?: boolean | null;
}

/**
 * react-native-purchases가 던지는 PurchasesError를 설치된 SDK의 에러 코드 정의로
 * 분류한다. 취소/네트워크/보류(불확실한 트랜잭션)/기타 4가지로 나눠 화면이
 * 서로 다른 복구 전략(무시/재시도 안내/reconcile 후 재시도 허용)을 취할 수 있게 한다.
 */
export function classifyPurchaseError(error: unknown): PurchaseErrorKind {
	const purchasesError = error as PurchaseErrorLike | undefined;

	if (
		purchasesError?.userCancelled ||
		purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
	) {
		return 'cancelled';
	}

	if (
		purchasesError?.code === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
		purchasesError?.code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR ||
		purchasesError?.code === PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR
	) {
		return 'network';
	}

	if (
		purchasesError?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR ||
		purchasesError?.code === PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR
	) {
		return 'pending';
	}

	return 'other';
}
