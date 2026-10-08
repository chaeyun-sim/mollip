import { getFeaturedPageIndex, getFeaturedPageMetrics } from '../featuredPaging';

describe('getFeaturedPageMetrics — 반응형 카드 치수', () => {
	it('화면 폭에서 좌우 여백을 뺀 카드 폭과 카드+간격 스냅 간격을 반환한다', () => {
		expect(getFeaturedPageMetrics(390, 24, 12)).toEqual({ cardWidth: 342, interval: 354 });
	});

	it('폭이 매우 좁아도 카드 폭이 음수가 되지 않는다', () => {
		expect(getFeaturedPageMetrics(20, 24, 12).cardWidth).toBe(0);
	});
});

describe('getFeaturedPageIndex — 스크롤 오프셋 → 페이지 인덱스', () => {
	it('오프셋 0은 0번째 페이지다', () => {
		expect(getFeaturedPageIndex(0, 354, 3)).toBe(0);
	});

	it('절반을 넘기면 다음 페이지로 반올림한다', () => {
		expect(getFeaturedPageIndex(354 * 0.4, 354, 3)).toBe(0);
		expect(getFeaturedPageIndex(354 * 0.6, 354, 3)).toBe(1);
	});

	it('바운스로 범위를 벗어나도 0..count-1로 고정한다', () => {
		expect(getFeaturedPageIndex(-40, 354, 3)).toBe(0);
		expect(getFeaturedPageIndex(354 * 5, 354, 3)).toBe(2);
	});

	it('간격이 0이거나 항목이 없으면 0을 반환한다', () => {
		expect(getFeaturedPageIndex(100, 0, 3)).toBe(0);
		expect(getFeaturedPageIndex(100, 354, 0)).toBe(0);
	});
});
