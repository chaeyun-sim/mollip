import type { CustomerInfo } from 'react-native-purchases';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';

export const ENTITLEMENT_ID = '몰립_pro';

export const formatSubscriptionDate = (value: string | null | undefined) => {
	if (!value) return '-';
	return new Intl.DateTimeFormat('ko-KR', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date(value));
};

export function syncSubscription(customerInfo: CustomerInfo) {
	const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

	useSubscriptionStore.getState().setCustomerInfo({
		isPremium: !!entitlement,
		productIdentifier: entitlement?.productIdentifier ?? null,
		expirationDate: entitlement?.expirationDate ?? null,
		willRenew: entitlement?.willRenew ?? false,
	});
}
