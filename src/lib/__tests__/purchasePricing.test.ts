import {
	computeDiscountPercent,
	computePerDayPrice,
	formatPerDayPrice,
	parseSubscriptionPeriodDays,
} from '../purchasePricing';

describe('parseSubscriptionPeriodDays', () => {
	it('P1W → 7일', () => {
		expect(parseSubscriptionPeriodDays('P1W')).toBe(7);
	});
	it('P1M → 30일', () => {
		expect(parseSubscriptionPeriodDays('P1M')).toBe(30);
	});
	it('P6M → 180일 (월=30일 근사)', () => {
		expect(parseSubscriptionPeriodDays('P6M')).toBe(180);
	});
	it('P1Y → 365일', () => {
		expect(parseSubscriptionPeriodDays('P1Y')).toBe(365);
	});
	it('null/undefined/빈 문자열 → null', () => {
		expect(parseSubscriptionPeriodDays(null)).toBeNull();
		expect(parseSubscriptionPeriodDays(undefined)).toBeNull();
		expect(parseSubscriptionPeriodDays('')).toBeNull();
	});
	it('형식이 아닌 문자열 → null', () => {
		expect(parseSubscriptionPeriodDays('not-a-period')).toBeNull();
	});
});

describe('computePerDayPrice', () => {
	it('실제 가격/주기로 일일 환산가를 계산한다', () => {
		expect(
			computePerDayPrice({ price: 34900, currencyCode: 'KRW', subscriptionPeriod: 'P6M' }),
		).toBeCloseTo(34900 / 180);
	});
	it('주기 정보가 없으면 null(가짜 값 생성 금지)', () => {
		expect(
			computePerDayPrice({ price: 34900, currencyCode: 'KRW', subscriptionPeriod: null }),
		).toBeNull();
	});
	it('가격이 음수/NaN이면 null', () => {
		expect(
			computePerDayPrice({ price: -1, currencyCode: 'KRW', subscriptionPeriod: 'P1M' }),
		).toBeNull();
		expect(
			computePerDayPrice({ price: NaN, currencyCode: 'KRW', subscriptionPeriod: 'P1M' }),
		).toBeNull();
	});
});

describe('formatPerDayPrice', () => {
	it('KRW 상품을 현지화 통화 문자열로 포맷한다', () => {
		const formatted = formatPerDayPrice({
			price: 7900,
			currencyCode: 'KRW',
			subscriptionPeriod: 'P1M',
		});
		expect(formatted).not.toBeNull();
		expect(formatted).toMatch(/\d/);
	});
	it('계산 불가 상품은 null — 빈 문자열/가짜 텍스트를 만들지 않는다', () => {
		expect(
			formatPerDayPrice({ price: 100, currencyCode: 'KRW', subscriptionPeriod: null }),
		).toBeNull();
	});
});

describe('computeDiscountPercent', () => {
	const krw = (perDay: number | null) => ({ perDay, currencyCode: 'KRW' });
	const usd = (perDay: number | null) => ({ perDay, currencyCode: 'USD' });

	it('할인 대상이 기준보다 저렴하면 절감률(%)을 반환한다', () => {
		// weekly 557원/일, sixMonths 193원/일 → 약 65% 절감
		expect(computeDiscountPercent(krw(557), krw(193))).toBe(65);
	});
	it('기준값이 없으면(상품 미존재) null — 가짜 할인율 금지', () => {
		expect(computeDiscountPercent(null, krw(193))).toBeNull();
	});
	it('비교값이 없으면 null', () => {
		expect(computeDiscountPercent(krw(557), null)).toBeNull();
	});
	it('perDay가 null이면(계산 불가 상품) null', () => {
		expect(computeDiscountPercent(krw(null), krw(193))).toBeNull();
		expect(computeDiscountPercent(krw(557), krw(null))).toBeNull();
	});
	it('할인 대상이 기준보다 비싸거나 같으면 null', () => {
		expect(computeDiscountPercent(krw(100), krw(100))).toBeNull();
		expect(computeDiscountPercent(krw(100), krw(150))).toBeNull();
	});
	it('통화가 다르면 환율 없이 비교할 수 없으므로 null — 잘못된 할인율 표시 금지', () => {
		expect(computeDiscountPercent(krw(557), usd(193))).toBeNull();
	});
});
