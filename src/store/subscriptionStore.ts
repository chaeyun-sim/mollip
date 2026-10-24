import { create } from 'zustand';

interface SubscriptionState {
	isPremium: boolean;
	profileIsPremium: boolean;
	/** profiles.is_premium 조회를 마친 사용자 id. 현재 로그인 사용자와 다르면 아직 모르는 상태다. */
	profileSyncedUserId: string | null;
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
	/** userId를 넘기면 해당 사용자의 프로필 조회가 끝났음을 함께 기록한다. */
	setProfilePremium: (isPremium: boolean, userId?: string | null) => void;
	/** 로그아웃·계정 전환 시 이전 계정의 권한이 남지 않게 모든 권한 상태를 비운다. */
	resetSubscription: () => void;

	setSubscriptionLoading: (loading: boolean) => void;
	setLastOnlineVerifiedAt: (value: string | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
	isPremium: false,
	profileIsPremium: false,
	profileSyncedUserId: null,
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

	setProfilePremium: (profileIsPremium, userId = null) =>
		set((state) => ({
			profileIsPremium,
			profileSyncedUserId: userId,
			isPremium: state.revenueCatIsPremium || profileIsPremium,
		})),

	resetSubscription: () =>
		set({
			isPremium: false,
			profileIsPremium: false,
			profileSyncedUserId: null,
			revenueCatIsPremium: false,
			productIdentifier: null,
			expirationDate: null,
			willRenew: false,
			billingIssueDetectedAt: null,
		}),

	setSubscriptionLoading: (isSubscriptionLoading) => set({ isSubscriptionLoading }),
	setLastOnlineVerifiedAt: (lastOnlineVerifiedAt) => set({ lastOnlineVerifiedAt }),
}));
