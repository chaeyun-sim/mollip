import { create } from 'zustand';

interface SubscriptionState {
	isPremium: boolean;
	isSubscriptionLoading: boolean;

	productIdentifier: string | null;
	expirationDate: string | null;
	willRenew: boolean;
	billingIssueDetectedAt: string | null;
	lastOnlineVerifiedAt: string | null;

	setCustomerInfo: (customerInfo: {
		isPremium: boolean;
		productIdentifier?: string | null;
		expirationDate?: string | null;
		willRenew?: boolean;
		billingIssueDetectedAt?: string | null;
		lastOnlineVerifiedAt?: string | null;
	}) => void;

	setSubscriptionLoading: (loading: boolean) => void;
	setLastOnlineVerifiedAt: (value: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
	isPremium: false,
	isSubscriptionLoading: true,

	productIdentifier: null,
	expirationDate: null,
	willRenew: false,
	billingIssueDetectedAt: null,
	lastOnlineVerifiedAt: null,

	setCustomerInfo: ({
		isPremium,
		productIdentifier = null,
		expirationDate = null,
		willRenew = false,
		billingIssueDetectedAt = null,
		lastOnlineVerifiedAt,
	}) =>
		set({
			isPremium,
			productIdentifier,
			expirationDate,
			willRenew,
			billingIssueDetectedAt,
			...(lastOnlineVerifiedAt !== undefined ? { lastOnlineVerifiedAt } : {}),
		}),

	setSubscriptionLoading: (isSubscriptionLoading) => set({ isSubscriptionLoading }),
	setLastOnlineVerifiedAt: (lastOnlineVerifiedAt) => set({ lastOnlineVerifiedAt }),
}));
