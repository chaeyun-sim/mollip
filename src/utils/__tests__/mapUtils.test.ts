import { isOpenOn } from '../mapUtils';

describe('isOpenOn — 지도 "영업 중" 필터', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		// 2026-10-09(금) 14:00 — 오늘 날짜 기준 판정 경로를 타도록 시스템 시각을 고정한다
		jest.setSystemTime(new Date(2026, 9, 9, 14, 0));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('물결표(~) 구분 운영시간도 영업 중으로 판정한다', () => {
		expect(isOpenOn('평일 09:00~18:00', new Date())).toBe(true);
	});

	it('하이픈·엔대시 구분 운영시간도 계속 판정한다', () => {
		expect(isOpenOn('10:00 - 20:00', new Date())).toBe(true);
		expect(isOpenOn('10:00 – 20:00', new Date())).toBe(true);
	});

	it('운영시간 밖이면 영업 중이 아니다', () => {
		expect(isOpenOn('평일 15:00~18:00', new Date())).toBe(false);
	});
});
