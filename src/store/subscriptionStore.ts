import { create } from 'zustand';

interface SubscriptionState {
	isPremium: boolean;
	isSubscriptionLoading: boolean;

	productIdentifier: string | null;
	expirationDate: string | null;
	willRenew: boolean;

	setCustomerInfo: (customerInfo: {
		isPremium: boolean;
		productIdentifier?: string | null;
		expirationDate?: string | null;
		willRenew?: boolean;
	}) => void;

	setSubscriptionLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
	isPremium: false,
	isSubscriptionLoading: true,

	productIdentifier: null,
	expirationDate: null,
	willRenew: false,

	setCustomerInfo: ({
		isPremium,
		productIdentifier = null,
		expirationDate = null,
		willRenew = false,
	}) =>
		set({
			isPremium,
			productIdentifier,
			expirationDate,
			willRenew,
		}),

	setSubscriptionLoading: (isSubscriptionLoading) => set({ isSubscriptionLoading }),
}));
