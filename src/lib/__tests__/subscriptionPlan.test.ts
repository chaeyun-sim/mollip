import { resolveSubscriptionPlan } from '@/src/lib/subscriptionPlan';

describe('resolveSubscriptionPlan', () => {
	it.each([
		['6months', 'sixMonths'],
		['mollip_premium_6months', 'sixMonths'],
		['com.simune.mollip.six_month', 'sixMonths'],
		['premium-6-mo', 'sixMonths'],
		['mollip_halfyear', 'sixMonths'],
		['weekly', 'weekly'],
		['mollip_premium_weekly', 'weekly'],
		['com.simune.mollip.1week', 'weekly'],
		['monthly', 'monthly'],
		['mollip_premium_monthly', 'monthly'],
		['MOLLIP_PREMIUM_MONTHLY', 'monthly'],
	])('%s → %s', (productId, plan) => {
		expect(resolveSubscriptionPlan(productId)).toBe(plan);
	});

	it('버전 숫자 6이 붙은 월간 상품을 6개월로 오인하지 않는다', () => {
		expect(resolveSubscriptionPlan('premium_v6_monthly')).toBe('monthly');
	});

	it('알 수 없는 상품 ID나 빈 값은 null', () => {
		expect(resolveSubscriptionPlan('mollip_pro')).toBeNull();
		expect(resolveSubscriptionPlan(null)).toBeNull();
		expect(resolveSubscriptionPlan('')).toBeNull();
	});
});
