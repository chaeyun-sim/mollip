import { dateKeyFrom } from '@/src/utils/visitKey';
import { WEEKDAYS } from '@/src/constants/week';
import { isValidExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { parseDate } from '@/src/utils/mapUtils';

/** 함께한 사람 — 예전 기록에 남아 있을 수 있는 동행 값 (로컬 DB 읽기용) */
export type Companion = 'alone' | 'friend' | 'partner' | 'family' | 'coworker' | 'group';

export const COMPANION_LABELS: Record<Companion, string> = {
	alone: '혼자',
	friend: '친구',
	partner: '연인',
	family: '가족',
	coworker: '동료',
	group: '모임',
};

/** 기록할 때 올릴 수 있는 사진 수 — 선택, 최대 6장(3×2) */
export const MAX_RECORD_PHOTOS = 6;

const startOfDay = (date: Date) => {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
};

/** 방문일 기본값 — 오늘, 단 이미 끝난 전시면 마감일 */
export const getDefaultVisitDate = (
	today: Date,
	period?: { start?: string | null; end?: string | null },
): Date => {
	const base = startOfDay(today);
	const end = isValidExhibitionDateString(period?.end) ? parseDate(period?.end as string) : null;
	return end !== null && end.getTime() < base.getTime() ? end : base;
};

/** "2026-10-09" → "10.09 금" — 방문일 표시 */
export const toPassDate = (dateKey: string): string => {
	const [y, m, d] = dateKey.split('-').map(Number);
	const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
	return `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} ${weekday}`;
};

/** 기록 작성 중 방문일 — 도슨트 관람은 그날로 고정, 고르지 않았으면 오늘(끝난 전시는 마감일) */
export const getRecordDateKey = (
	draft: {
		fixedDateKey?: string;
		dateKey?: string;
		startDate?: string | null;
		endDate?: string | null;
	},
	today: Date = new Date(),
): string =>
	draft.fixedDateKey ??
	draft.dateKey ??
	dateKeyFrom(getDefaultVisitDate(today, { start: draft.startDate, end: draft.endDate }));
