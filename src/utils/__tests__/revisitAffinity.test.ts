import type { DayVisit } from '@/src/store/visitStore';
import {
	buildRevisitAffinity,
	lovedExhibitionIds,
	revisitMatchesFor,
	REVISIT_GENRE_SCORE,
	REVISIT_VENUE_SCORE,
} from '../revisitAffinity';

const visit = (overrides: Partial<DayVisit>): DayVisit => ({
	exhibitionId: '1',
	listened: [],
	status: 'confirmed',
	...overrides,
});

describe('lovedExhibitionIds', () => {
	it('"또 갈래요"로 확정한 전시만 중복 없이 모은다', () => {
		expect(
			lovedExhibitionIds({
				a: visit({ exhibitionId: '3', isRevisit: true }),
				b: visit({ exhibitionId: '3', isRevisit: true }),
				c: visit({ exhibitionId: '4', isRevisit: false }),
				d: visit({ exhibitionId: '5' }),
				e: visit({ exhibitionId: '6', isRevisit: true, status: 'pending' }),
				f: visit({ exhibitionId: null, isRevisit: true }),
			}),
		).toEqual([3]);
	});
});

describe('revisitMatchesFor', () => {
	const affinity = buildRevisitAffinity([
		{ id: 3, museum_id: 10, genre: '사진' },
		{ id: 4, museum_id: null, genre: null },
	]);

	it('같은 미술관이면 미술관 태그와 점수', () => {
		expect(revisitMatchesFor({ museum_id: 10, genre: '회화' }, affinity)).toEqual({
			tags: ['revisit_venue'],
			score: REVISIT_VENUE_SCORE,
		});
	});

	it('같은 장르면 장르 태그와 점수, 둘 다면 합산', () => {
		expect(revisitMatchesFor({ museum_id: 99, genre: '사진' }, affinity)).toEqual({
			tags: ['revisit_genre'],
			score: REVISIT_GENRE_SCORE,
		});
		expect(revisitMatchesFor({ museum_id: 10, genre: '사진' }, affinity).score).toBe(
			REVISIT_VENUE_SCORE + REVISIT_GENRE_SCORE,
		);
	});

	it('겹치는 게 없으면 0점', () => {
		expect(revisitMatchesFor({ museum_id: null, genre: null }, affinity)).toEqual({
			tags: [],
			score: 0,
		});
	});
});
