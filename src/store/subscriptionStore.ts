import { create } from 'zustand';

interface SubscriptionState {
	isPremium: boolean;
	profileIsPremium: boolean;
	revenueCatIsPremium: boolean;
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
	setProfilePremium: (isPremium: boolean) => void;

	setSubscriptionLoading: (loading: boolean) => void;
	setLastOnlineVerifiedAt: (value: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
	isPremium: false,
	profileIsPremium: false,
	revenueCatIsPremium: false,
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
		set((state) => ({
			isPremium: isPremium || state.profileIsPremium,
			revenueCatIsPremium: isPremium,
			productIdentifier,
			expirationDate,
			willRenew,
			billingIssueDetectedAt,
			...(lastOnlineVerifiedAt !== undefined ? { lastOnlineVerifiedAt } : {}),
		})),

	setProfilePremium: (profileIsPremium) =>
		set((state) => ({
			profileIsPremium,
			isPremium: state.revenueCatIsPremium || profileIsPremium,
		})),

	setSubscriptionLoading: (isSubscriptionLoading) => set({ isSubscriptionLoading }),
	setLastOnlineVerifiedAt: (lastOnlineVerifiedAt) => set({ lastOnlineVerifiedAt }),
}));
