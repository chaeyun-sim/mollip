import { buildWeeklyHours, getOpenStatus } from '@/src/utils/venueOpenStatus';

// 2026-11-23은 월요일, 2026-11-24는 화요일
const MONDAY = new Date(2026, 10, 23, 12, 0);
const TUESDAY = new Date(2026, 10, 24, 12, 0);
const NODEUL_HOURS = '평일 10:00-21:00\n공휴일 10:00-22:00';

describe('getOpenStatus', () => {
	it('휴관일이면 closed-today', () => {
		expect(getOpenStatus(NODEUL_HOURS, '월', MONDAY, MONDAY)).toEqual({ kind: 'closed-today' });
	});

	it('운영시간 안이면 open + 표시용 시간', () => {
		expect(getOpenStatus(NODEUL_HOURS, '월', TUESDAY, TUESDAY)).toEqual({
			kind: 'open',
			hours: '10:00–21:00',
		});
	});

	it('오늘 마감 시간이 지났으면 closed', () => {
		const lateTuesday = new Date(2026, 10, 24, 21, 30);
		expect(getOpenStatus(NODEUL_HOURS, '월', lateTuesday, lateTuesday)).toEqual({
			kind: 'closed',
			hours: '10:00–21:00',
		});
	});

	it('오늘이 아닌 날짜는 마감 여부를 따지지 않는다', () => {
		const lateMonday = new Date(2026, 10, 23, 23, 0);
		expect(getOpenStatus(NODEUL_HOURS, undefined, TUESDAY, lateMonday)).toEqual({
			kind: 'open',
			hours: '10:00–21:00',
		});
	});

	it('운영시간 정보가 없으면 no-info', () => {
		expect(getOpenStatus('운영시간 정보 없음', undefined, TUESDAY, TUESDAY)).toEqual({
			kind: 'no-info',
		});
		expect(getOpenStatus('', undefined, TUESDAY, TUESDAY)).toEqual({ kind: 'no-info' });
	});

	it('시간 형식을 못 찾으면 원문을 그대로 돌려준다', () => {
		expect(getOpenStatus('사전 예약제', undefined, TUESDAY, TUESDAY)).toEqual({
			kind: 'raw',
			text: '사전 예약제',
		});
	});
});

describe('buildWeeklyHours', () => {
	it('월요일부터 일요일까지 7일을 Date.getDay 인덱스와 함께 돌려준다', () => {
		const weekly = buildWeeklyHours(NODEUL_HOURS, '월');
		expect(weekly.map((entry) => entry.dayIndex)).toEqual([1, 2, 3, 4, 5, 6, 0]);
		expect(weekly[0]).toEqual({ dayIndex: 1, hours: null, isClosed: true });
		expect(weekly[1]).toEqual({ dayIndex: 2, hours: '10:00-21:00', isClosed: false });
	});

	it('시간을 못 찾는 날은 hours가 null이고 휴관은 아니다', () => {
		const weekly = buildWeeklyHours('사전 예약제', undefined);
		expect(weekly.every((entry) => entry.hours === null && !entry.isClosed)).toBe(true);
	});
});
