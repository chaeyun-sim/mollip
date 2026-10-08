import { getExhibitionStatus, isValidExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { parseDate } from '@/src/utils/mapUtils';

/** 이 일수 이내로 남은 진행 중 전시는 "마감 임박" — 홈 레일·검색 필터·강조색이 같은 기준을 쓴다 */
export const CLOSING_SOON_DAYS = 14;
/** 마감일 당일은 철수 중일 수 있어 "마감 임박"으로 추천하지 않는다 */
export const CLOSING_SOON_MIN_DAYS = 1;
const CLOSING_SOON_LIMIT = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

interface ExhibitionDates {
	startDate?: string | null;
	endDate?: string | null;
}

export interface ExhibitionMeta {
	label: string;
	/** true면 D-day 강조색으로 표시 */
	urgent: boolean;
}

const toDates = (ex: ExhibitionDates) => {
	if (!isValidExhibitionDateString(ex.startDate) || !isValidExhibitionDateString(ex.endDate)) {
		return null;
	}
	return { startDate: ex.startDate as string, endDate: ex.endDate as string };
};

const startOfDay = (date: Date) => {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
};

const formatMonthDay = (date: Date) => `${date.getMonth() + 1}.${date.getDate()}`;

/** 진행 중 전시의 남은 일수 (오늘 마감 = 0). 진행 중이 아니거나 날짜가 없으면 null */
const getDaysLeft = (ex: ExhibitionDates, base: Date): number | null => {
	const dates = toDates(ex);
	if (dates === null || getExhibitionStatus(dates, base) !== 'ongoing') return null;
	return Math.round((parseDate(dates.endDate).getTime() - startOfDay(base).getTime()) / DAY_MS);
};

/** 카드 하단 메타 라벨 — 마감 임박 D-day, 예정 개막일, 진행 중 종료일 */
export const getExhibitionMeta = (
	ex: ExhibitionDates,
	base: Date = new Date(),
): ExhibitionMeta | null => {
	const dates = toDates(ex);
	if (dates === null) return null;

	const status = getExhibitionStatus(dates, base);
	if (status === 'upcoming') {
		return { label: `${formatMonthDay(parseDate(dates.startDate))} 개막`, urgent: false };
	}

	if (status === 'ended') return null;

	const daysLeft = getDaysLeft(dates, base) ?? 0;
	if (daysLeft <= CLOSING_SOON_DAYS) {
		return { label: daysLeft === 0 ? '오늘 마감' : `D-${daysLeft}`, urgent: true };
	}

	return { label: `~${formatMonthDay(parseDate(dates.endDate))} 까지`, urgent: false };
};

/** 검색 "마감 임박" 필터 — 1~14일 남은 진행 중 전시면 남은 일수, 아니면 null */
export const getClosingSoonDaysLeft = (
	ex: ExhibitionDates,
	base: Date = new Date(),
): number | null => {
	const daysLeft = getDaysLeft(ex, base);
	if (daysLeft === null || daysLeft < CLOSING_SOON_MIN_DAYS || daysLeft > CLOSING_SOON_DAYS) {
		return null;
	}
	return daysLeft;
};

interface PickClosingSoonOptions {
	base?: Date;
	excludeIds?: string[];
	limit?: number;
	maxDays?: number;
	/** 남은 일수 하한 — 1이면 오늘 마감(철수일일 수 있음)을 뺀다 */
	minDays?: number;
}

/** 여러 소스에서 maxDays(기본 14일) 이내 마감 진행 중 전시를 마감 순으로 고른다 (제외·중복 ID 제거) */
export const pickClosingSoon = <T extends ExhibitionDates & { id: string }>(
	sources: T[][],
	{
		base = new Date(),
		excludeIds = [],
		limit = CLOSING_SOON_LIMIT,
		maxDays = CLOSING_SOON_DAYS,
		minDays = 0,
	}: PickClosingSoonOptions = {},
): (T & { daysLeft: number })[] => {
	const seen = new Set(excludeIds);
	const picked: (T & { daysLeft: number })[] = [];

	for (const item of sources.flat()) {
		if (seen.has(item.id)) continue;
		const daysLeft = getDaysLeft(item, base);
		if (daysLeft === null || daysLeft < minDays || daysLeft > maxDays) continue;
		seen.add(item.id);
		picked.push({ ...item, daysLeft });
	}

	return picked.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, limit);
};

/** 날짜(로컬 자정 기준)마다 하루씩 넘어가는 순환 인덱스 */
export const getDailyIndex = (base: Date, length: number): number => {
	if (length <= 0) return 0;
	const day = startOfDay(base);
	const dayNumber = Math.round((day.getTime() - day.getTimezoneOffset() * 60 * 1000) / DAY_MS);
	return ((dayNumber % length) + length) % length;
};
