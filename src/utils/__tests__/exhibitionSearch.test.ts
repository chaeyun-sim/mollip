import {
	daysUntilEnd,
	getDdayLabel,
	getExhibitionStatus,
	isViewableOn,
	matchesExcluded,
	matchesQuery,
} from '../exhibitionSearch';
import type { Exhibition } from '../../data/exhibitions';

const base: Exhibition = {
	id: 't1',
	title: '모네, 빛을 그리다',
	venue: '예술의전당',
	startDate: '2026.05.01',
	endDate: '2026.08.31',
	artist: '클로드 모네',
	description: '인상주의 특별전',
	posterColor: '#fff',
	openHours: '10:00 – 20:00',
	admission: '18,000원',
	artworks: [],
	relatedExhibitionIds: [],
	tags: ['인상주의', '명화'],
};

describe('getExhibitionStatus — 진행 상태 계산', () => {
	it('기간 내 → ongoing', () => {
		expect(getExhibitionStatus(base, new Date(2026, 6, 15))).toBe('ongoing');
	});
	it('시작 전 → upcoming', () => {
		expect(getExhibitionStatus(base, new Date(2026, 3, 30))).toBe('upcoming');
	});
	it('종료 후 → ended', () => {
		expect(getExhibitionStatus(base, new Date(2026, 8, 1))).toBe('ended');
	});
	it('시작일 당일 → ongoing (경계값)', () => {
		expect(getExhibitionStatus(base, new Date(2026, 4, 1))).toBe('ongoing');
	});
	it('종료일 당일 → ongoing (경계값)', () => {
		expect(getExhibitionStatus(base, new Date(2026, 7, 31))).toBe('ongoing');
	});
});

describe('matchesQuery — 검색어 매칭', () => {
	it('제목 매칭', () => {
		expect(matchesQuery(base, '모네')).toBe(true);
	});
	it('미술관 매칭', () => {
		expect(matchesQuery(base, '예술의전당')).toBe(true);
	});
	it('작가 매칭', () => {
		expect(matchesQuery(base, '클로드')).toBe(true);
	});
	it('태그 매칭', () => {
		expect(matchesQuery(base, '인상주의')).toBe(true);
	});
	it('빈 검색어 → 전체 통과', () => {
		expect(matchesQuery(base, '  ')).toBe(true);
	});
	it('무관한 검색어 → 미매칭', () => {
		expect(matchesQuery(base, '피카소')).toBe(false);
	});
});

describe('matchesExcluded — 제외어', () => {
	it('제목에 제외어 포함 → 걸러짐', () => {
		expect(matchesExcluded(base, ['모네'])).toBe(true);
	});
	it('설명에 제외어 포함 → 걸러짐', () => {
		expect(matchesExcluded(base, ['특별전'])).toBe(true);
	});
	it('무관한 제외어 → 통과', () => {
		expect(matchesExcluded(base, ['미디어아트'])).toBe(false);
	});
	it('제외어 없음 → 통과', () => {
		expect(matchesExcluded(base, [])).toBe(false);
	});
});

describe('daysUntilEnd / getDdayLabel — 마감 임박', () => {
	it('종료일 7일 전 → 7', () => {
		expect(daysUntilEnd(base, new Date(2026, 7, 24))).toBe(7);
	});
	it('종료일 당일 → 0', () => {
		expect(daysUntilEnd(base, new Date(2026, 7, 31))).toBe(0);
	});
	it('D-7 이내 → 마감 D-n 라벨', () => {
		expect(getDdayLabel(base, new Date(2026, 7, 28))).toBe('마감 D-3');
	});
	it('종료일 당일 → 오늘 마감', () => {
		expect(getDdayLabel(base, new Date(2026, 7, 31))).toBe('오늘 마감');
	});
	it('7일 초과 남음 → null', () => {
		expect(getDdayLabel(base, new Date(2026, 6, 1))).toBeNull();
	});
	it('예정 전시 → null', () => {
		expect(getDdayLabel(base, new Date(2026, 3, 1))).toBeNull();
	});
	it('마감된 전시 → null', () => {
		expect(getDdayLabel(base, new Date(2026, 8, 10))).toBeNull();
	});
});

describe('isViewableOn — 날짜 필터', () => {
	it('기간 내 날짜 → 관람 가능', () => {
		expect(isViewableOn(base, new Date(2026, 5, 10))).toBe(true);
	});
	it('기간 밖 날짜 → 불가', () => {
		expect(isViewableOn(base, new Date(2026, 9, 10))).toBe(false);
	});
});
