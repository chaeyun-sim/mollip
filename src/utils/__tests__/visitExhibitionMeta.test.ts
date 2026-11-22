import type { DayVisit } from '@/src/store/visitStore';
import { buildVisitExhibitionMeta, visitExhibitionIds } from '../visitExhibitionMeta';

const visit = (exhibitionId: string | null): DayVisit => ({
	exhibitionId,
	exhibitionTitle: '전시',
	listened: [],
});

describe('visitExhibitionIds', () => {
	it('숫자 ID만 중복 없이 정렬해 모은다', () => {
		expect(
			visitExhibitionIds({
				a: visit('9'),
				b: visit('3'),
				c: visit('9'),
				d: visit(null),
				e: visit('abc'),
			}),
		).toEqual([3, 9]);
	});
});

describe('buildVisitExhibitionMeta', () => {
	it('한 번 받은 전시 행으로 기록별 포스터와 영문 이름을 만든다', () => {
		const visits = { '2026-10-01::id:3': visit('3'), '2026-10-02::id:9': visit('9') };
		const result = buildVisitExhibitionMeta(visits, [
			{ id: 3, image_url: ' poster3 ', title_en: 'Do Ho Suh', museums: { name_en: 'MMCA Seoul' } },
			{ id: 9, image_url: null, title_en: null, museums: [{ name_en: null }] },
		]);
		expect(result.posterUrls).toEqual({ '2026-10-01::id:3': 'poster3' });
		expect(result.englishNames).toEqual({
			'2026-10-01::id:3': { title: 'Do Ho Suh', venue: 'MMCA Seoul' },
		});
	});
});
