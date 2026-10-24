import * as Sentry from '@sentry/react-native';

export const OFFLINE_ACCESS_WINDOW_MS = 72 * 60 * 60 * 1000;
const LAST_ONLINE_VERIFIED_AT_KEY = '@mollip/subscription/last-online-verified-at';
const PENDING_PURCHASE_RECONCILIATION_KEY = '@mollip/subscription/pending-purchase-reconciliation';

// USR-05 D4: 표식 저장 실패는 구매 흐름을 막지 않지만(더 나쁜 선택이라) 발생 빈도를
// 운영에서 추적할 수 있어야 한다 — breadcrumb만 남기고 에러는 삼킨 채로 유지한다.
function reportPendingReconciliationWriteFailure(action: 'mark' | 'clear', error: unknown) {
	Sentry.addBreadcrumb({
		category: 'purchase.pending-reconciliation',
		message: `pending reconciliation 표식 ${action} 실패`,
		level: 'warning',
		data: { error: error instanceof Error ? error.message : String(error) },
	});
}

// 테스트·Expo Go처럼 네이티브 AsyncStorage 모듈이 없는 환경에서도 구독 로직을
// 순수하게 검증할 수 있도록 실제 저장소는 호출 시점에 지연 로드한다.
type AsyncStorageStatic = typeof import('@react-native-async-storage/async-storage').default;

function getStorage(): AsyncStorageStatic {
	// eslint-disable-next-line @typescript-eslint/no-require-imports -- 위 주석의 지연 로드를 위해 의도적으로 require를 쓴다
	const storageModule = require('@react-native-async-storage/async-storage');
	// ESM 번들은 default로, CommonJS 모듈(jest 목 등)은 모듈 자체로 내보낸다 — 둘 다 받는다.
	return (storageModule.default ?? storageModule) as AsyncStorageStatic;
}

export async function loadLastOnlineVerifiedAt(): Promise<string | null> {
	try {
		return await getStorage().getItem(LAST_ONLINE_VERIFIED_AT_KEY);
	} catch (error) {
		console.error('구독 온라인 검증 시각 조회 실패:', error);
		return null;
	}
}

export async function markOnlineVerifiedAt(
	value = new Date().toISOString(),
): Promise<string | null> {
	try {
		await getStorage().setItem(LAST_ONLINE_VERIFIED_AT_KEY, value);
		return value;
	} catch (error) {
		console.error('구독 온라인 검증 시각 저장 실패:', error);
		return null;
	}
}

/**
 * 저장된 pending 표식의 기록 시각(ms)을 돌려준다. 표식이 없거나 조회에 실패하면 null.
 * 구버전 값 '1'은 기록 시각을 모르므로 0으로 해석한다.
 */
export async function loadPendingPurchaseReconciliation(): Promise<number | null> {
	try {
		const value = await getStorage().getItem(PENDING_PURCHASE_RECONCILIATION_KEY);
		if (value === null) return null;
		const markedAt = Number(value);
		return value !== '1' && Number.isFinite(markedAt) ? markedAt : 0;
	} catch (error) {
		console.error('구매 reconciliation 표식 조회 실패:', error);
		return null;
	}
}

/** 표식을 기록한다. 저장에 성공하면 true — 실패해도 예외를 던지지 않는다(구매 흐름을 막지 않음). */
export async function markPendingPurchaseReconciliation(markedAt = Date.now()): Promise<boolean> {
	try {
		await getStorage().setItem(PENDING_PURCHASE_RECONCILIATION_KEY, String(markedAt));
		return true;
	} catch (error) {
		console.error('구매 reconciliation 표식 저장 실패:', error);
		reportPendingReconciliationWriteFailure('mark', error);
		return false;
	}
}

export async function clearPendingPurchaseReconciliation(): Promise<void> {
	try {
		await getStorage().removeItem(PENDING_PURCHASE_RECONCILIATION_KEY);
	} catch (error) {
		console.error('구매 reconciliation 표식 삭제 실패:', error);
		reportPendingReconciliationWriteFailure('clear', error);
	}
}

export function isWithinOfflineAccessWindow(
	lastVerifiedAt: string | null,
	now = Date.now(),
): boolean {
	if (!lastVerifiedAt) return false;
	const verifiedAt = Date.parse(lastVerifiedAt);
	if (!Number.isFinite(verifiedAt) || verifiedAt > now) return false;
	return now - verifiedAt <= OFFLINE_ACCESS_WINDOW_MS;
}
