/**
 * RevenueCat 상품의 실제 가격 정보(price/currencyCode/subscriptionPeriod)로부터
 * 일일 환산가·할인율을 계산한다. 상품이 없으면 null을 반환할 뿐, 하드코딩된
 * 가격이나 가짜 할인율을 채워 넣지 않는다.
 */

const ISO_PERIOD_PATTERN = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/;

/** ISO 8601 구독 주기(P1W, P1M, P6M 등)를 일수로 근사 변환한다. */
export function parseSubscriptionPeriodDays(period: string | null | undefined): number | null {
	if (!period) return null;

	const match = ISO_PERIOD_PATTERN.exec(period);
	if (!match) return null;

	const [, years, months, weeks, days] = match;
	const totalDays =
		Number(years ?? 0) * 365 +
		Number(months ?? 0) * 30 +
		Number(weeks ?? 0) * 7 +
		Number(days ?? 0);

	return totalDays > 0 ? totalDays : null;
}

interface PriceableProduct {
	price: number;
	currencyCode: string;
	subscriptionPeriod: string | null;
}

/** 상품의 총 가격을 실제 구독 주기로 나눈 일일 환산가(숫자)를 반환한다. */
export function computePerDayPrice(product: PriceableProduct): number | null {
	const days = parseSubscriptionPeriodDays(product.subscriptionPeriod);
	if (!days || !Number.isFinite(product.price) || product.price < 0) return null;

	return product.price / days;
}

/** 일일 환산가를 상품 통화로 현지화 포맷팅한다. 계산 불가 시 null. */
export function formatPerDayPrice(product: PriceableProduct): string | null {
	const perDay = computePerDayPrice(product);
	if (perDay === null) return null;

	const isKRW = product.currencyCode === 'KRW';

	try {
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: product.currencyCode,
			minimumFractionDigits: isKRW ? 0 : 2,
			maximumFractionDigits: isKRW ? 0 : 2,
		}).format(perDay);
	} catch {
		return null;
	}
}

/**
 * 기준(base) 대비 할인 대상(discounted)의 절감률(%)을 계산한다.
 * 두 상품의 통화가 다르면(가정 위반) 환율 없이 비교할 수 없으므로 null —
 * 신뢰할 수 없는 할인율을 보여주느니 배지를 생략한다.
 */
export function computeDiscountPercent(
	base: { perDay: number | null; currencyCode: string } | null,
	discounted: { perDay: number | null; currencyCode: string } | null,
): number | null {
	if (!base || !discounted) return null;
	if (base.currencyCode !== discounted.currencyCode) return null;

	const basePerDay = base.perDay;
	const discountedPerDay = discounted.perDay;
	if (basePerDay === null || discountedPerDay === null) return null;
	if (!Number.isFinite(basePerDay) || basePerDay <= 0) return null;
	if (!Number.isFinite(discountedPerDay) || discountedPerDay < 0) return null;
	if (discountedPerDay >= basePerDay) return null;

	return Math.round((1 - discountedPerDay / basePerDay) * 100);
}
