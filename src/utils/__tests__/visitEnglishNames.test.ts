import type { DayVisit } from '@/src/store/visitStore';
import { localizeVisitNames } from '@/src/utils/visitEnglishNames';

const visit = (overrides: Partial<DayVisit>): DayVisit =>
	({ status: 'confirmed', listened: [], ...overrides }) as DayVisit;

describe('localizeVisitNames', () => {
	it('영문 제목·장소가 있으면 바꾸고, 없는 값은 원래 값을 유지한다', () => {
		const visits = {
			a: visit({ exhibitionId: '1', exhibitionTitle: '빛의 정원', venue: '국립현대미술관' }),
			b: visit({ exhibitionId: '2', exhibitionTitle: '조각전', venue: '리움' }),
			c: visit({ exhibitionId: null, exhibitionTitle: '직접 기록', venue: '동네 갤러리' }),
		};
		const result = localizeVisitNames(visits, {
			a: { title: 'Garden of Light', venue: 'MMCA' },
			b: { title: 'Sculpture Show' },
		});

		expect(result.a.exhibitionTitle).toBe('Garden of Light');
		expect(result.a.venue).toBe('MMCA');
		expect(result.b.exhibitionTitle).toBe('Sculpture Show');
		expect(result.b.venue).toBe('리움');
		expect(result.c).toBe(visits.c);
	});

	it('원본 기록 객체는 바꾸지 않는다', () => {
		const visits = { a: visit({ exhibitionId: '1', exhibitionTitle: '빛의 정원' }) };
		localizeVisitNames(visits, { a: { title: 'Garden of Light' } });
		expect(visits.a.exhibitionTitle).toBe('빛의 정원');
	});
});
