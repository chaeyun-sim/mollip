import { isSubscriptionPending } from '../useSubscription';

// authStore는 supabase(AsyncStorage 네이티브 모듈)를 끌어오므로, 순수 판정 함수 테스트에서는 대체한다.
jest.mock('@/src/store/authStore', () => ({ useAuthStore: jest.fn() }));

describe('isSubscriptionPending', () => {
	it('RevenueCat 부트스트랩 중이면 로딩이다', () => {
		expect(
			isSubscriptionPending({ isSubscriptionLoading: true, profileSyncedUserId: null }, null),
		).toBe(true);
	});

	it('로그인했는데 프로필 조회가 아직이면 로딩이다 (SYNC-001, STATE-001)', () => {
		expect(
			isSubscriptionPending({ isSubscriptionLoading: false, profileSyncedUserId: null }, 'user-a'),
		).toBe(true);
	});

	it('다른 사용자의 프로필 조회 결과는 현재 사용자에게 유효하지 않다', () => {
		expect(
			isSubscriptionPending(
				{ isSubscriptionLoading: false, profileSyncedUserId: 'user-a' },
				'user-b',
			),
		).toBe(true);
	});

	it('프로필 조회가 끝났으면 로딩이 아니다', () => {
		expect(
			isSubscriptionPending(
				{ isSubscriptionLoading: false, profileSyncedUserId: 'user-a' },
				'user-a',
			),
		).toBe(false);
	});

	it('비로그인이면 프로필 조회를 기다리지 않는다', () => {
		expect(
			isSubscriptionPending({ isSubscriptionLoading: false, profileSyncedUserId: null }, null),
		).toBe(false);
	});
});
