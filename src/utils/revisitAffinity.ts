import type { DayVisit } from '@/src/store/visitStore';

/** "또 갈래요" 전시와 같은 미술관 가점 */
export const REVISIT_VENUE_SCORE = 30;
/** "또 갈래요" 전시와 같은 장르 가점 */
export const REVISIT_GENRE_SCORE = 20;

export type RevisitTag = 'revisit_venue' | 'revisit_genre';

/** 좋아한 전시에서 뽑은 미술관·장르 */
export interface RevisitAffinity {
	museumIds: Set<number>;
	genres: Set<string>;
}

export interface RevisitSourceRow {
	id: number;
	museum_id: number | null;
	genre: string | null;
}

/** 기록하기에서 "또 갈래요"로 확정한 전시 ID — 정렬·중복 제거 (쿼리 키로도 쓴다) */
export const lovedExhibitionIds = (visits: Record<string, DayVisit>): number[] =>
	[
		...new Set(
			Object.values(visits)
				.filter((visit) => visit.status === 'confirmed' && visit.isRevisit === true)
				.map((visit) => Number(visit.exhibitionId))
				.filter((id) => Number.isFinite(id) && id > 0),
		),
	].sort((a, b) => a - b);

export const buildRevisitAffinity = (rows: RevisitSourceRow[]): RevisitAffinity => ({
	museumIds: new Set(
		rows.map((row) => row.museum_id).filter((id): id is number => typeof id === 'number'),
	),
	genres: new Set(
		rows.map((row) => row.genre?.trim()).filter((genre): genre is string => Boolean(genre)),
	),
});

/** 추천 후보 전시가 좋아한 전시와 겹치는지 — 추천 이유 태그와 가점 */
export const revisitMatchesFor = (
	row: { museum_id: number | null; genre: string | null },
	affinity: RevisitAffinity,
): { tags: RevisitTag[]; score: number } => {
	const tags: RevisitTag[] = [];
	let score = 0;
	if (row.museum_id !== null && affinity.museumIds.has(row.museum_id)) {
		tags.push('revisit_venue');
		score += REVISIT_VENUE_SCORE;
	}
	if (row.genre && affinity.genres.has(row.genre)) {
		tags.push('revisit_genre');
		score += REVISIT_GENRE_SCORE;
	}
	return { tags, score };
};
