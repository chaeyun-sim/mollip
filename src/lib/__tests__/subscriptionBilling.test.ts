import { syncSubscription } from '../subscription';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';

const entitlement = (overrides: Record<string, unknown> = {}) =>
	({
		productIdentifier: 'mollip.monthly',
		expirationDate: '2026-10-01T00:00:00.000Z',
		willRenew: true,
		billingIssueDetectedAt: null,
		lastOnlineVerifiedAt: null,
		...overrides,
	}) as never;

const customerInfo = (active: Record<string, unknown>, all: Record<string, unknown> = active) =>
	({ entitlements: { active, all } }) as never;

beforeEach(() => {
	useSubscriptionStore.setState({
		isPremium: false,
		isSubscriptionLoading: false,
		productIdentifier: null,
		expirationDate: null,
		willRenew: false,
		billingIssueDetectedAt: null,
	});
});

describe('subscription billing issue sync', () => {
	it('활성 entitlement의 결제 문제는 권한을 유지하고 경고 시각을 저장한다', () => {
		syncSubscription(
			customerInfo({
				몰립_pro: entitlement({ billingIssueDetectedAt: '2026-09-23T00:00:00.000Z' }),
			}),
		);

		const state = useSubscriptionStore.getState();
		expect(state.isPremium).toBe(true);
		expect(state.billingIssueDetectedAt).toBe('2026-09-23T00:00:00.000Z');
	});

	it('비활성 entitlement의 결제 문제는 권한을 지급하지 않지만 경고 정보는 보존한다', () => {
		syncSubscription(
			customerInfo(
				{},
				{ 몰립_pro: entitlement({ billingIssueDetectedAt: '2026-09-23T00:00:00.000Z' }) },
			),
		);

		const state = useSubscriptionStore.getState();
		expect(state.isPremium).toBe(false);
		expect(state.billingIssueDetectedAt).toBe('2026-09-23T00:00:00.000Z');
	});

	it('복구된 active entitlement는 결제 경고를 지우고 권한을 복구한다', () => {
		syncSubscription(customerInfo({ 몰립_pro: entitlement({ billingIssueDetectedAt: null }) }));

		const state = useSubscriptionStore.getState();
		expect(state.isPremium).toBe(true);
		expect(state.billingIssueDetectedAt).toBeNull();
	});

	it('willRenew가 false여도 active entitlement면 만료 전 권한을 유지한다', () => {
		syncSubscription(customerInfo({ 몰립_pro: entitlement({ willRenew: false }) }));

		expect(useSubscriptionStore.getState().isPremium).toBe(true);
	});

	it('온라인 검증 후 72시간 이내의 캐시 entitlement는 오프라인에서도 허용한다', () => {
		const verifiedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		useSubscriptionStore.setState({ lastOnlineVerifiedAt: verifiedAt });

		syncSubscription(customerInfo({ 몰립_pro: entitlement() }));

		expect(useSubscriptionStore.getState().isPremium).toBe(true);
	});

	it('온라인 검증 후 72시간이 지난 캐시 entitlement는 권한을 유지하지 않는다', () => {
		const verifiedAt = new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString();
		useSubscriptionStore.setState({ lastOnlineVerifiedAt: verifiedAt });

		syncSubscription(customerInfo({ 몰립_pro: entitlement() }));

		expect(useSubscriptionStore.getState().isPremium).toBe(false);
	});

	it('부트스트랩에서 온라인 검증이 실패하면 검증 시각 없이 캐시만으로 권한을 주지 않는다', () => {
		syncSubscription(customerInfo({ 몰립_pro: entitlement() }), { allowUnverified: false });

		expect(useSubscriptionStore.getState().isPremium).toBe(false);
	});
});
