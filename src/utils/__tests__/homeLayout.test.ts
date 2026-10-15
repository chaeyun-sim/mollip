import { fillToCount, getGridColumnWidth } from '../homeLayout';

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

describe('fillToCount — 그리드 칸 채우기', () => {
	const a = { id: 'a' };
	const b = { id: 'b' };
	const c = { id: 'c' };
	const d = { id: 'd' };

	it('주 목록이 모자라면 보조 목록에서 중복 없이 채운다', () => {
		expect(fillToCount([a, b, c], [b, d, { id: 'e' }], 4).map((x) => x.id)).toEqual([
			'a',
			'b',
			'c',
			'd',
		]);
	});

	it('주 목록이 충분하면 개수만큼 자른다', () => {
		expect(fillToCount([a, b, c, d, { id: 'e' }], [], 4).map((x) => x.id)).toEqual([
			'a',
			'b',
			'c',
			'd',
		]);
	});

	it('둘 다 모자라면 있는 만큼만', () => {
		expect(fillToCount([a], [a], 4).map((x) => x.id)).toEqual(['a']);
	});
});
