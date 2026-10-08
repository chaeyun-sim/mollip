import { getGridColumnWidth } from '../homeLayout';

describe('getGridColumnWidth — 2열 그리드 열 폭', () => {
	it('iPhone 15(393)에서 여백 24, 간격 16이면 두 열 합이 콘텐츠 폭을 넘지 않는다', () => {
		const w = getGridColumnWidth(393, 24, 16);
		expect(w).toBe(164);
		expect(w * 2 + 16).toBeLessThanOrEqual(393 - 48);
	});

	it('홀수 폭에서도 내림해 합이 넘치지 않는다', () => {
		const w = getGridColumnWidth(375, 24, 16);
		expect(w * 2 + 16).toBeLessThanOrEqual(375 - 48);
	});

	it('폭이 극단적으로 좁아도 음수가 되지 않는다', () => {
		expect(getGridColumnWidth(30, 24, 16)).toBe(0);
	});
});
