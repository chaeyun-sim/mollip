import type { DayVisit } from '@/src/store/visitStore';
import type { VisitEnglishName } from '@/src/utils/visitEnglishNames';

/** exhibitions에서 기록 표시용으로 받아오는 한 행 */
export interface VisitExhibitionRow {
	id: number;
	image_url: string | null;
	title_en: string | null;
	museums: { name_en: string | null } | { name_en: string | null }[] | null;
}

export interface VisitExhibitionMetaMaps {
	/** visitKey → 전시 포스터 URL */
	posterUrls: Record<string, string>;
	/** visitKey → 전시 영문 제목·장소 */
	englishNames: Record<string, VisitEnglishName>;
}

/** 기록에 연결된 전시 ID — 숫자가 아닌 값은 빼고 중복 없이 정렬한다 (쿼리 키로도 쓴다) */
export const visitExhibitionIds = (visits: Record<string, DayVisit>): number[] =>
	[
		...new Set(
			Object.values(visits)
				.map((visit) => Number(visit.exhibitionId))
				.filter((id) => Number.isFinite(id) && id > 0),
		),
	].sort((a, b) => a - b);

/** 전시 행을 기록 키 기준의 포스터·영문 이름 맵으로 바꾼다 */
export const buildVisitExhibitionMeta = (
	visits: Record<string, DayVisit>,
	rows: VisitExhibitionRow[],
): VisitExhibitionMetaMaps => {
	const byId = new Map(rows.map((row) => [row.id, row]));
	const posterUrls: Record<string, string> = {};
	const englishNames: Record<string, VisitEnglishName> = {};

	for (const [key, visit] of Object.entries(visits)) {
		const row = byId.get(Number(visit.exhibitionId));
		if (!row) continue;
		const poster = row.image_url?.trim();
		if (poster) posterUrls[key] = poster;
		const museum = Array.isArray(row.museums) ? row.museums[0] : row.museums;
		const title = row.title_en?.trim() || undefined;
		const venue = museum?.name_en?.trim() || undefined;
		if (title || venue) englishNames[key] = { title, venue };
	}

	return { posterUrls, englishNames };
};
