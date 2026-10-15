import { getDefaultVisitDate, getRecordDateKey, toPassDate } from '../visitRecord';

// 2026.10.09 금요일 오후
const FRIDAY = new Date(2026, 9, 9, 15, 0);
const keyOf = (d: Date) => `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;

describe('getDefaultVisitDate — 방문일 기본값', () => {
	it('진행 중이거나 기간을 모르면 오늘 (시각은 자정으로)', () => {
		const date = getDefaultVisitDate(FRIDAY, { start: '2026.09.01', end: '2026.10.20' });
		expect(keyOf(date)).toBe('2026.10.9');
		expect(date.getHours()).toBe(0);
		expect(keyOf(getDefaultVisitDate(FRIDAY))).toBe('2026.10.9');
	});

	it('이미 끝난 전시면 마감일', () => {
		expect(keyOf(getDefaultVisitDate(FRIDAY, { start: '2026.08.01', end: '2026.09.30' }))).toBe(
			'2026.9.30',
		);
	});
});

describe('toPassDate — 방문일 표시', () => {
	it('YYYY-MM-DD를 두 자리 월.일 + 요일로', () => {
		expect(toPassDate('2026-10-09')).toBe('10.09 금');
		expect(toPassDate('2026-01-04')).toBe('01.04 일');
	});
});

describe('getRecordDateKey — 기록 중 방문일', () => {
	const today = new Date(2026, 9, 13);

	it('도슨트 관람일이 고정돼 있으면 항상 그 날짜', () => {
		expect(getRecordDateKey({ fixedDateKey: '2026-10-01', dateKey: '2026-10-05' }, today)).toBe(
			'2026-10-01',
		);
	});

	it('고른 날짜가 있으면 그 날짜', () => {
		expect(getRecordDateKey({ dateKey: '2026-10-05' }, today)).toBe('2026-10-05');
	});

	it('고르지 않았으면 오늘, 이미 끝난 전시면 마감일', () => {
		expect(getRecordDateKey({}, today)).toBe('2026-10-13');
		expect(getRecordDateKey({ startDate: '2026.06.18', endDate: '2026.10.11' }, today)).toBe(
			'2026-10-11',
		);
	});
});
