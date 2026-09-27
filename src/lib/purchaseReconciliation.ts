import type { CustomerInfo } from 'react-native-purchases';

import { usePurchaseTransactionStore } from '@/src/store/purchaseTransactionStore';
import { ENTITLEMENT_ID } from '@/src/lib/subscription';
import {
	clearPendingPurchaseReconciliation,
	loadPendingPurchaseReconciliation,
} from '@/src/lib/subscriptionVerification';

/**
 * 디스크에 남은 pending 표식을 메모리 상태로 복원한다(앱 재실행 시 1회).
 * 표식이 있었으면 그때의 generation을, 없었으면 null을 돌려준다.
 */
export const restorePendingReconciliation = async (): Promise<number | null> => {
	const markedAt = await loadPendingPurchaseReconciliation();
	if (markedAt === null) return null;
	return usePurchaseTransactionStore.getState().markPending(markedAt);
};

/** active entitlement가 pending 시작 시각 이후에 구매(또는 갱신)된 것인지 판정한다. */
export const hasEntitlementPurchasedSince = (
	customerInfo: CustomerInfo,
	pendingSince: number | null,
): boolean => {
	const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
	if (!entitlement) return false;
	if (pendingSince === null) return true;
	return entitlement.latestPurchaseDateMillis >= pendingSince;
};

/**
 * 자동 경로(재실행·포그라운드 재조회·CustomerInfo 리스너)에서 pending을 해제한다.
 * 아래를 모두 만족할 때만 해제하며, inactive 결과만으로는 절대 해제하지 않는다.
 * - 진행 중인 구매가 없다
 * - 조회를 시작한 뒤 새 pending이 시작되지 않았다(expectedGeneration 일치)
 * - active entitlement가 pending 시작 이후에 구매됐다
 */
export const settlePendingIfConfirmed = async (
	customerInfo: CustomerInfo,
	expectedGeneration: number,
): Promise<boolean> => {
	const { isPending, pendingSince, clearPendingIfIdle } = usePurchaseTransactionStore.getState();
	if (!isPending || !hasEntitlementPurchasedSince(customerInfo, pendingSince)) return false;
	if (!clearPendingIfIdle(expectedGeneration)) return false;
	// 메모리 해제와 같은 틱에 삭제를 요청해, 이후 새 구매의 표식 저장보다 먼저 처리되게 한다.
	await clearPendingPurchaseReconciliation();
	return true;
};
