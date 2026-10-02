const makeCustomerInfo = (active: boolean) => ({
	entitlements: {
		active: active
			? { 몰립_pro: { productIdentifier: 'weekly', willRenew: true, expirationDate: null } }
			: {},
		all: {},
	},
});

jest.mock('react-native-purchases', () => ({
	__esModule: true,
	default: {
		logIn: jest.fn(),
		logOut: jest.fn(),
		isAnonymous: jest.fn(),
		getAppUserID: jest.fn(),
	},
}));

jest.mock('@/src/lib/subscriptionVerification', () => ({
	markOnlineVerifiedAt: jest.fn(async () => '2026-10-02T00:00:00.000Z'),
	isWithinOfflineAccessWindow: jest.fn(() => true),
}));

// 모듈 단위 상태(configured promise, 실패한 logIn)를 테스트마다 새로 만든다.
const load = () => {
	jest.resetModules();
	const Purchases = jest.requireMock('react-native-purchases').default;
	const identity = jest.requireActual('../purchasesIdentity');
	const { useSubscriptionStore } = jest.requireActual('@/src/store/subscriptionStore');
	identity.markPurchasesConfigured(true);
	return { Purchases, identity, store: useSubscriptionStore };
};

const neverCancelled = () => false;

describe('syncPurchasesIdentity', () => {
	it('로그인하면 Purchases.logIn으로 계정 id를 연결하고 그 계정의 권한을 반영한다', async () => {
		const { Purchases, identity, store } = load();
		Purchases.getAppUserID.mockResolvedValue('$RCAnonymousID:abc');
		Purchases.logIn.mockResolvedValue({ customerInfo: makeCustomerInfo(true), created: false });

		await identity.syncPurchasesIdentity('user-a', neverCancelled);

		expect(Purchases.logIn).toHaveBeenCalledWith('user-a');
		expect(store.getState().isPremium).toBe(true);
	});

	it('이미 같은 id로 식별돼 있으면 logIn을 다시 호출하지 않는다 (오프라인 콜드 스타트 보호)', async () => {
		const { Purchases, identity } = load();
		Purchases.getAppUserID.mockResolvedValue('user-a');

		await identity.syncPurchasesIdentity('user-a', neverCancelled);

		expect(Purchases.logIn).not.toHaveBeenCalled();
	});

	it('로그아웃하면 권한을 비우고 Purchases.logOut을 호출한다 (AUTH-001, AUTH-002)', async () => {
		const { Purchases, identity, store } = load();
		store.getState().setCustomerInfo({ isPremium: true });
		Purchases.isAnonymous.mockResolvedValue(false);
		Purchases.logOut.mockResolvedValue(makeCustomerInfo(false));

		await identity.syncPurchasesIdentity(null, neverCancelled);

		expect(Purchases.logOut).toHaveBeenCalled();
		expect(store.getState().isPremium).toBe(false);
	});

	it('익명 상태의 비로그인이면 게스트 구매 권한을 건드리지 않는다', async () => {
		const { Purchases, identity, store } = load();
		store.getState().setCustomerInfo({ isPremium: true });
		Purchases.isAnonymous.mockResolvedValue(true);

		await identity.syncPurchasesIdentity(null, neverCancelled);

		expect(Purchases.logOut).not.toHaveBeenCalled();
		expect(store.getState().isPremium).toBe(true);
	});

	it('logIn이 실패하면 이전 계정의 권한이 남지 않게 비우고 익명으로 전환한다', async () => {
		const { Purchases, identity, store } = load();
		store.getState().setCustomerInfo({ isPremium: true });
		Purchases.getAppUserID.mockResolvedValue('user-a');
		Purchases.logIn.mockRejectedValue(new Error('network'));
		Purchases.logOut.mockResolvedValue(makeCustomerInfo(false));

		await identity.syncPurchasesIdentity('user-b', neverCancelled);

		expect(store.getState().isPremium).toBe(false);
		expect(Purchases.logOut).toHaveBeenCalled();
	});

	it('실패한 logIn은 retryFailedPurchasesLogIn으로 다시 시도한다', async () => {
		const { Purchases, identity, store } = load();
		Purchases.getAppUserID.mockResolvedValue('$RCAnonymousID:abc');
		Purchases.logIn.mockRejectedValueOnce(new Error('network'));
		Purchases.logOut.mockResolvedValue(makeCustomerInfo(false));
		await identity.syncPurchasesIdentity('user-b', neverCancelled);

		Purchases.logIn.mockResolvedValue({ customerInfo: makeCustomerInfo(true), created: false });
		await identity.retryFailedPurchasesLogIn();

		expect(Purchases.logIn).toHaveBeenLastCalledWith('user-b');
		expect(store.getState().isPremium).toBe(true);
	});
});
