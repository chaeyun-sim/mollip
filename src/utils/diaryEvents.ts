import { isValidExhibitionDateString } from '@/src/utils/exhibitionSearch';

/** 다이어리 캘린더 칩 — 스크랩한 전시가 열리는 날(open)과 닫히는 날(close) */
export interface DayEvent {
	id: string;
	title: string;
	kind: 'open' | 'close';
}

interface DatedExhibition {
	id: string;
	title: string;
	startDate?: string | null;
	endDate?: string | null;
}

/** 《》〈〉「」『』 안의 전시명 */
const QUOTED_TITLE_RE = /[《〈「『]([^》〉」』]+)[》〉」』]/;
/** 제목 앞의 "2026 " 같은 연도 */
const LEADING_YEAR_RE = /^\d{4}\s+/;

/** 좁은 칩에 들어갈 짧은 전시명 — 괄호 속 이름이 있으면 그것만, 없으면 앞 연도를 뗀다 */
export const toShortTitle = (title: string): string => {
	const trimmed = title.trim();
	const quoted = trimmed.match(QUOTED_TITLE_RE)?.[1]?.trim();
	return quoted || trimmed.replace(LEADING_YEAR_RE, '');
};

/** "2026.10.07" → "2026-10-07" (visitStore·캘린더 dateKey와 같은 형식), 형식이 다르면 null */
const toDateKey = (date: string | null | undefined): string | null =>
	isValidExhibitionDateString(date) ? (date as string).trim().replaceAll('.', '-') : null;

/** 전시 목록을 날짜별 개막·마감 칩으로 묶는다 — 같은 날에는 개막을 먼저 둔다 */
export const buildDayEvents = (exhibitions: DatedExhibition[]): Record<string, DayEvent[]> => {
	const byDate: Record<string, DayEvent[]> = {};

	const push = (dateKey: string | null, event: DayEvent) => {
		if (dateKey === null) return;
		(byDate[dateKey] ??= []).push(event);
	};

	for (const ex of exhibitions) {
		const title = toShortTitle(ex.title);
		push(toDateKey(ex.startDate), { id: ex.id, title, kind: 'open' });
		push(toDateKey(ex.endDate), { id: ex.id, title, kind: 'close' });
	}

	for (const events of Object.values(byDate)) {
		events.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'open' ? -1 : 1));
	}

	return byDate;
};
