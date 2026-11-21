export type SubscriptionPlan = 'weekly' | 'monthly' | 'sixMonths';

// 6 앞이 영숫자면(v6 등 버전 표기) 6개월로 보지 않는다
const SIX_MONTHS_PATTERN = /(^|[^a-z0-9])(6|six)[\s._-]*(month|mo)|half/;

/**
 * 스토어 상품 ID에서 플랜 종류를 추정한다.
 * 실제 상품 ID 형식이 정해져 있지 않아 키워드로 판별하며,
 * `6months`에도 `month`가 들어 있으므로 6개월을 가장 먼저 검사한다.
 */
export const resolveSubscriptionPlan = (
	productId: string | null | undefined,
): SubscriptionPlan | null => {
	if (!productId) return null;
	const id = productId.toLowerCase();
	if (SIX_MONTHS_PATTERN.test(id)) return 'sixMonths';
	if (id.includes('week')) return 'weekly';
	if (id.includes('month')) return 'monthly';
	return null;
};
