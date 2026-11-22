import type { DayVisit } from '@/src/store/visitStore';

export interface VisitEnglishName {
	title?: string;
	venue?: string;
}

/**
 * 기록에 저장된 한국어 전시명·장소를 영문 값으로 바꾼 표시용 사본을 만든다.
 * 영문 값이 없는 항목은 원래 값을 그대로 둔다 — 원본 기록은 건드리지 않는다.
 */
export const localizeVisitNames = (
	visits: Record<string, DayVisit>,
	names: Record<string, VisitEnglishName>,
): Record<string, DayVisit> =>
	Object.fromEntries(
		Object.entries(visits).map(([key, visit]) => {
			const name = names[key];
			if (!name?.title && !name?.venue) return [key, visit];
			return [
				key,
				{
					...visit,
					exhibitionTitle: name.title ?? visit.exhibitionTitle,
					venue: name.venue ?? visit.venue,
				},
			];
		}),
	);
