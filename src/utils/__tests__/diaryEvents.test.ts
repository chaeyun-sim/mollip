import { buildDayEvents, toShortTitle } from '../diaryEvents';

const ex = (id: string, startDate: string, endDate: string) => ({
	id,
	title: `전시 ${id}`,
	startDate,
	endDate,
});

describe('buildDayEvents — 스크랩한 전시의 개막·마감일', () => {
	it('개막일과 마감일을 각각 YYYY-MM-DD 키로 묶는다', () => {
		const events = buildDayEvents([ex('a', '2026.10.07', '2026.10.20')]);
		expect(events['2026-10-07']).toEqual([{ id: 'a', title: '전시 a', kind: 'open' }]);
		expect(events['2026-10-20']).toEqual([{ id: 'a', title: '전시 a', kind: 'close' }]);
	});

	it('같은 날 여러 전시는 개막을 먼저, 그다음 마감 순서로', () => {
		const events = buildDayEvents([
			ex('a', '2026.09.01', '2026.10.10'),
			ex('b', '2026.10.10', '2026.11.01'),
		]);
		expect(events['2026-10-10'].map((e) => [e.id, e.kind])).toEqual([
			['b', 'open'],
			['a', 'close'],
		]);
	});

	it('하루짜리 전시는 같은 날에 개막·마감이 함께', () => {
		const events = buildDayEvents([ex('a', '2026.10.10', '2026.10.10')]);
		expect(events['2026-10-10'].map((e) => e.kind)).toEqual(['open', 'close']);
	});

	it('날짜 형식이 잘못된 쪽은 건너뛴다', () => {
		const events = buildDayEvents([ex('a', '', '2026.10.20'), ex('b', '2026-10-01', 'x')]);
		expect(Object.keys(events)).toEqual(['2026-10-20']);
	});
});

describe('toShortTitle — 칩에 들어갈 짧은 전시명', () => {
	it('겹낫표·꺾쇠 안의 이름이 있으면 그것만', () => {
		expect(
			toShortTitle('2026 경기도박물관 개관 30주년 기념 기증 특별전 《혼자 보긴 아까워서》'),
		).toBe('혼자 보긴 아까워서');
		expect(toShortTitle('2026 다티스트〈심윤 : 회색 극장〉')).toBe('심윤 : 회색 극장');
	});

	it('괄호가 없으면 앞의 연도만 뗀다', () => {
		expect(toShortTitle('2026 서울 사진 축제')).toBe('서울 사진 축제');
		expect(toShortTitle('제목전(展)')).toBe('제목전(展)');
	});
});
