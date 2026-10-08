import {
	getClosingSoonDaysLeft,
	getDailyIndex,
	getExhibitionMeta,
	pickClosingSoon,
} from '../homeExhibitionMeta';

const BASE = new Date(2026, 9, 7, 15, 0); // 2026.10.07 오후

const item = (id: string, startDate: string | null, endDate: string | null) => ({
	id,
	title: `전시 ${id}`,
	venue: '장소',
	thumbnail: null,
	status: 'ongoing' as const,
	startDate,
	endDate,
});

describe('getExhibitionMeta — 카드 메타 라벨', () => {
	it('진행 중이고 14일 이내 마감이면 D-n 긴급 라벨', () => {
		expect(getExhibitionMeta({ startDate: '2026.09.01', endDate: '2026.10.12' }, BASE)).toEqual({
			label: 'D-5',
			urgent: true,
		});
	});

	it('오늘 마감이면 "오늘 마감"', () => {
		expect(getExhibitionMeta({ startDate: '2026.09.01', endDate: '2026.10.07' }, BASE)).toEqual({
			label: '오늘 마감',
			urgent: true,
		});
	});

	it('14일보다 많이 남았으면 "~M.D 까지" 일반 라벨', () => {
		expect(getExhibitionMeta({ startDate: '2026.09.01', endDate: '2026.12.31' }, BASE)).toEqual({
			label: '~12.31 까지',
			urgent: false,
		});
	});

	it('예정 전시는 "M.D 개막"', () => {
		expect(getExhibitionMeta({ startDate: '2026.11.03', endDate: '2027.01.31' }, BASE)).toEqual({
			label: '11.3 개막',
			urgent: false,
		});
	});

	it('날짜가 없거나 형식이 틀리면 null', () => {
		expect(getExhibitionMeta({ startDate: null, endDate: '2026.10.12' }, BASE)).toBeNull();
		expect(getExhibitionMeta({ startDate: '2026-09-01', endDate: '2026.10.12' }, BASE)).toBeNull();
		expect(getExhibitionMeta({}, BASE)).toBeNull();
	});

	it('이미 끝난 전시는 null', () => {
		expect(getExhibitionMeta({ startDate: '2026.09.01', endDate: '2026.10.01' }, BASE)).toBeNull();
	});
});

describe('pickClosingSoon — 마감 임박 목록', () => {
	it('14일 이내 진행 중 전시만 마감 순으로 고른다', () => {
		const result = pickClosingSoon(
			[
				[
					item('a', '2026.09.01', '2026.10.20'), // D-13
					item('b', '2026.09.01', '2026.12.31'), // 범위 밖
					item('c', '2026.09.01', '2026.10.08'), // D-1
				],
				[item('d', '2026.10.20', '2026.10.25')], // 예정 → 제외
			],
			{ base: BASE },
		);
		expect(result.map((r) => r.id)).toEqual(['c', 'a']);
		expect(result[0].daysLeft).toBe(1);
	});

	it('제외 ID와 소스 간 중복 ID를 뺀다', () => {
		const result = pickClosingSoon(
			[
				[item('a', '2026.09.01', '2026.10.10'), item('b', '2026.09.01', '2026.10.11')],
				[item('a', '2026.09.01', '2026.10.10'), item('c', '2026.09.01', '2026.10.12')],
			],
			{ base: BASE, excludeIds: ['b'] },
		);
		expect(result.map((r) => r.id)).toEqual(['a', 'c']);
	});

	it('limit 개수까지만 반환하고 날짜 없는 항목은 무시한다', () => {
		const result = pickClosingSoon(
			[
				[
					item('a', '2026.09.01', '2026.10.09'),
					item('b', '2026.09.01', '2026.10.10'),
					item('x', null, null),
				],
			],
			{ base: BASE, limit: 1 },
		);
		expect(result.map((r) => r.id)).toEqual(['a']);
	});
});

describe('pickClosingSoon — maxDays', () => {
	it('maxDays를 넓히면 그 범위까지 포함한다', () => {
		const sources = [[item('a', '2026.09.01', '2026.10.30')]]; // D-23
		expect(pickClosingSoon(sources, { base: BASE })).toHaveLength(0);
		expect(pickClosingSoon(sources, { base: BASE, maxDays: 30 })[0].daysLeft).toBe(23);
	});
});

describe('pickClosingSoon — minDays', () => {
	it('minDays: 1이면 오늘 마감(철수일일 수 있음)은 뺀다', () => {
		const sources = [
			[item('today', '2026.09.01', '2026.10.07'), item('tomorrow', '2026.09.01', '2026.10.08')],
		];
		expect(pickClosingSoon(sources, { base: BASE }).map((r) => r.id)).toEqual([
			'today',
			'tomorrow',
		]);
		expect(pickClosingSoon(sources, { base: BASE, minDays: 1 }).map((r) => r.id)).toEqual([
			'tomorrow',
		]);
	});
});

describe('getClosingSoonDaysLeft — 검색 "마감 임박" 필터', () => {
	it('진행 중이고 1~14일 남았으면 남은 일수', () => {
		expect(getClosingSoonDaysLeft({ startDate: '2026.09.01', endDate: '2026.10.08' }, BASE)).toBe(
			1,
		);
		expect(getClosingSoonDaysLeft({ startDate: '2026.09.01', endDate: '2026.10.21' }, BASE)).toBe(
			14,
		);
	});

	it('오늘 마감(철수일일 수 있음)·15일 이상·예정·날짜 없음은 null', () => {
		expect(
			getClosingSoonDaysLeft({ startDate: '2026.09.01', endDate: '2026.10.07' }, BASE),
		).toBeNull();
		expect(
			getClosingSoonDaysLeft({ startDate: '2026.09.01', endDate: '2026.10.22' }, BASE),
		).toBeNull();
		expect(
			getClosingSoonDaysLeft({ startDate: '2026.10.10', endDate: '2026.10.12' }, BASE),
		).toBeNull();
		expect(getClosingSoonDaysLeft({ startDate: '', endDate: '' }, BASE)).toBeNull();
	});
});

describe('getDailyIndex — 날짜 고정 선택', () => {
	it('같은 날이면 시각과 무관하게 같은 인덱스', () => {
		expect(getDailyIndex(new Date(2026, 9, 7, 0, 1), 13)).toBe(
			getDailyIndex(new Date(2026, 9, 7, 23, 59), 13),
		);
	});

	it('다음 날이면 인덱스가 1 증가(순환)한다', () => {
		const today = getDailyIndex(new Date(2026, 9, 7), 13);
		expect(getDailyIndex(new Date(2026, 9, 8), 13)).toBe((today + 1) % 13);
	});

	it('길이가 0이면 0', () => {
		expect(getDailyIndex(BASE, 0)).toBe(0);
	});
});
