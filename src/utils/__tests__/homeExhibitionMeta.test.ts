import {
	formatBoardDate,
	formatHomeDate,
	getClosingSoonDaysLeft,
	getDailyIndex,
	getExhibitionMeta,
	pickDepartureRows,
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

describe('formatHomeDate', () => {
	it('마스트헤드 날짜를 "YYYY. M. D 요일" 형식으로 만든다', () => {
		expect(formatHomeDate(BASE)).toBe('2026. 10. 7 수요일');
		expect(formatHomeDate(new Date(2026, 0, 4))).toBe('2026. 1. 4 일요일');
	});
});

describe('pickDepartureRows — 출발 안내판', () => {
	const sources = [
		[
			// last call: 진행 중 · 1~3일 남음
			item('lc-3', '2026.09.01', '2026.10.10'),
			item('lc-1a', '2026.09.01', '2026.10.08'),
			item('lc-2', '2026.09.01', '2026.10.09'),
			item('lc-1b', '2026.09.01', '2026.10.08'),
			// boarding: 진행 중 · 4일 이상
			item('bd-c', '2026.09.01', '2026.11.01'),
			item('bd-a', '2026.09.01', '2026.10.15'),
			item('bd-d', '2026.09.01', '2026.12.01'),
			item('bd-b', '2026.09.01', '2026.10.20'),
		],
		[
			// on time: 개막 예정
			item('ot-b', '2026.10.20', '2026.12.31'),
			item('ot-a', '2026.10.12', '2026.12.31'),
			item('ot-c', '2026.11.01', '2026.12.31'),
			// 제외: 오늘 마감(철수일), 이미 끝남, 날짜 없음
			item('today', '2026.09.01', '2026.10.07'),
			item('ended', '2026.08.01', '2026.09.30'),
			item('nodate', null, null),
		],
	];

	it('상태별 3 · 3 · 2개를 마감(개막)이 가까운 순으로 고른다', () => {
		const { rows } = pickDepartureRows(sources, { base: BASE });
		expect(rows.map((r) => [r.id, r.departure])).toEqual([
			['lc-1a', 'last-call'],
			['lc-1b', 'last-call'],
			['lc-2', 'last-call'],
			['bd-a', 'boarding'],
			['bd-b', 'boarding'],
			['bd-c', 'boarding'],
			['ot-a', 'on-time'],
			['ot-b', 'on-time'],
		]);
	});

	it('날짜판은 진행 중이면 마감일, 개막 예정이면 개막일', () => {
		const { rows } = pickDepartureRows(sources, { base: BASE });
		expect(rows.find((r) => r.id === 'lc-2')?.boardDate).toBe('10.09');
		expect(rows.find((r) => r.id === 'ot-a')?.boardDate).toBe('10.12');
	});

	it('가장 가까운 마감 일수와 그 날 떠나는 전시 수를 함께 준다', () => {
		expect(pickDepartureRows(sources, { base: BASE }).nearest).toEqual({ daysLeft: 1, count: 2 });
	});

	it('제외 ID와 중복은 빼고, last call이 없으면 nearest는 null', () => {
		const { rows, nearest } = pickDepartureRows(
			[[item('bd-a', '2026.09.01', '2026.10.15')], sources[0]],
			{
				base: BASE,
				excludeIds: ['lc-1a', 'lc-1b', 'lc-2', 'lc-3'],
			},
		);
		expect(rows.map((r) => r.id)).toEqual(['bd-a', 'bd-b', 'bd-c']);
		expect(nearest).toBeNull();
	});
});

describe('formatBoardDate', () => {
	it('YYYY.MM.DD에서 안내판용 MM.DD만 남긴다', () => {
		expect(formatBoardDate('2026.10.10')).toBe('10.10');
	});

	it('형식이 맞지 않으면 빈 문자열', () => {
		expect(formatBoardDate(null)).toBe('');
		expect(formatBoardDate('2026-10-10')).toBe('');
	});
});
