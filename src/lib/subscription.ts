import type { CustomerInfo } from 'react-native-purchases';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import { isWithinOfflineAccessWindow } from '@/src/lib/subscriptionVerification';

export const ENTITLEMENT_ID = '몰립_pro';

export const formatSubscriptionDate = (value: string | null | undefined) => {
	if (!value) return '-';
	return new Intl.DateTimeFormat('ko-KR', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date(value));
};

export function syncSubscription(
	customerInfo: CustomerInfo,
	options: { onlineVerifiedAt?: string | null; allowUnverified?: boolean } = {},
) {
	const { onlineVerifiedAt, allowUnverified = true } = options;
	const activeEntitlement = customerInfo.entitlements.active?.[ENTITLEMENT_ID];
	const entitlement = activeEntitlement ?? customerInfo.entitlements.all?.[ENTITLEMENT_ID];
	const current = useSubscriptionStore.getState();
	const verifiedAt = onlineVerifiedAt ?? current.lastOnlineVerifiedAt;
	const hasOfflineAccess = isWithinOfflineAccessWindow(verifiedAt);
	// 온라인 검증 시각이 없으면 현재 구매 직후/복원 결과를 즉시 반영할 수 있다.
	// 단, 앱 재시작 시에는 부트스트랩에서 저장된 검증 시각을 먼저 로드해 정책을 재평가한다.
	const isPremium =
		!!activeEntitlement &&
		(onlineVerifiedAt !== undefined || (allowUnverified && !verifiedAt) || hasOfflineAccess);

	useSubscriptionStore.getState().setCustomerInfo({
		// 권한은 오직 RevenueCat이 active로 판정한 entitlement에서만 나온다.
		// billingIssueDetectedAt만으로 grace/access를 추정하지 않는다.
		isPremium,
		productIdentifier: entitlement?.productIdentifier ?? null,
		expirationDate: entitlement?.expirationDate ?? null,
		willRenew: entitlement?.willRenew ?? false,
		billingIssueDetectedAt: entitlement?.billingIssueDetectedAt ?? null,
		lastOnlineVerifiedAt: onlineVerifiedAt,
	});
}
