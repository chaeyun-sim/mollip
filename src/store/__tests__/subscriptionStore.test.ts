import { useSubscriptionStore } from '../subscriptionStore';

beforeEach(() => {
	useSubscriptionStore.getState().resetSubscription();
	useSubscriptionStore.getState().setProfilePremium(false);
});

describe('useSubscriptionStore', () => {
	it('resetSubscription은 RevenueCat 권한과 구독 상세를 모두 비운다 (AUTH-001)', () => {
		useSubscriptionStore.getState().setCustomerInfo({
			isPremium: true,
			productIdentifier: 'weekly',
			expirationDate: '2026-12-01T00:00:00Z',
			willRenew: true,
		});
		expect(useSubscriptionStore.getState().isPremium).toBe(true);

		useSubscriptionStore.getState().resetSubscription();

		const state = useSubscriptionStore.getState();
		expect(state.isPremium).toBe(false);
		expect(state.revenueCatIsPremium).toBe(false);
		expect(state.productIdentifier).toBeNull();
		expect(state.expirationDate).toBeNull();
		expect(state.willRenew).toBe(false);
	});

	it('resetSubscription은 프로필 premium 플래그도 비운다', () => {
		useSubscriptionStore.getState().setProfilePremium(true, 'user-a');

		useSubscriptionStore.getState().resetSubscription();

		const state = useSubscriptionStore.getState();
		expect(state.isPremium).toBe(false);
		expect(state.profileIsPremium).toBe(false);
		expect(state.profileSyncedUserId).toBeNull();
	});

	it('setProfilePremium은 조회가 끝난 사용자 id를 기록한다 (SYNC-001)', () => {
		useSubscriptionStore.getState().setProfilePremium(true, 'user-a');

		const state = useSubscriptionStore.getState();
		expect(state.isPremium).toBe(true);
		expect(state.profileSyncedUserId).toBe('user-a');
	});
});
