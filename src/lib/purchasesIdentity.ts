import Purchases from 'react-native-purchases';

import { syncSubscription } from '@/src/lib/subscription';
import { markOnlineVerifiedAt } from '@/src/lib/subscriptionVerification';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';

let resolveConfigured: (ok: boolean) => void = () => {};
const configured = new Promise<boolean>((resolve) => {
	resolveConfigured = resolve;
});

/** Purchases.configure 결과를 알린다. 설정 전에는 계정 연결을 시작하지 않는다. */
export const markPurchasesConfigured = (ok: boolean) => resolveConfigured(ok);

// 계정 연결·해제는 순서가 바뀌면 안 되므로 한 줄로 직렬화한다.
let identityQueue: Promise<void> = Promise.resolve();
// 네트워크 실패로 연결하지 못한 계정 — 포그라운드 복귀 시 다시 시도한다.
let failedLogInUserId: string | null = null;

const applyIdentity = async (userId: string | null, isCancelled: () => boolean) => {
	if (!(await configured)) return;

	try {
		if (userId === null) {
			failedLogInUserId = null;
			// 익명 상태(게스트 구매 포함)는 그대로 둔다. 계정에 묶인 상태일 때만 끊는다.
			if (await Purchases.isAnonymous()) return;
			useSubscriptionStore.getState().resetSubscription();
			await Purchases.logOut();
			return;
		}

		// 이미 같은 계정으로 식별돼 있으면 네트워크 호출 없이 부트스트랩 결과를 그대로 쓴다.
		if ((await Purchases.getAppUserID()) === userId) {
			failedLogInUserId = null;
			return;
		}

		const { customerInfo } = await Purchases.logIn(userId);
		failedLogInUserId = null;
		if (isCancelled()) return;
		const verifiedAt = await markOnlineVerifiedAt();
		syncSubscription(
			customerInfo,
			verifiedAt ? { onlineVerifiedAt: verifiedAt, allowUnverified: false } : {},
		);
	} catch (error) {
		console.error('RevenueCat 계정 연결 실패:', error);
		if (userId === null) return;
		// 이전 계정의 권한을 새 계정이 물려받지 않도록 비우고 익명으로 전환한 뒤 재시도를 예약한다.
		failedLogInUserId = userId;
		useSubscriptionStore.getState().resetSubscription();
		await Purchases.logOut().catch(() => {});
	}
};

/** 로그인 계정과 RevenueCat 고객 id를 일치시킨다. userId가 null이면 로그아웃으로 본다. */
export const syncPurchasesIdentity = (userId: string | null, isCancelled: () => boolean) => {
	identityQueue = identityQueue.then(() => applyIdentity(userId, isCancelled));
	return identityQueue;
};

export const retryFailedPurchasesLogIn = () =>
	failedLogInUserId === null
		? Promise.resolve()
		: syncPurchasesIdentity(failedLogInUserId, () => false);
