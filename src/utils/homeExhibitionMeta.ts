import { getExhibitionStatus, isValidExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { parseDate } from '@/src/utils/mapUtils';

/** 이 일수 이내로 남은 진행 중 전시는 "마감 임박" — 홈 레일·검색 필터·강조색이 같은 기준을 쓴다 */
export const CLOSING_SOON_DAYS = 14;
/** 마감일 당일은 철수 중일 수 있어 "마감 임박"으로 추천하지 않는다 */
export const CLOSING_SOON_MIN_DAYS = 1;
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

/** 출발 안내판 상태 — 곧 마감(last call) · 진행 중(boarding) · 개막 예정(on time) */
export type DepartureStatus = 'last-call' | 'boarding' | 'on-time';

/** 이 일수 이내로 남은 진행 중 전시는 last call */
const LAST_CALL_MAX_DAYS = 3;
const DEPARTURE_QUOTA: Record<DepartureStatus, number> = {
	'last-call': 3,
	boarding: 3,
	'on-time': 2,
};

/** 출발 안내판 날짜판 — "2026.10.10" → "10.10", 형식이 다르면 빈 문자열 */
export const formatBoardDate = (date: string | null | undefined): string =>
	isValidExhibitionDateString(date) ? (date as string).trim().slice(5) : '';

export type DepartureRow<T> = T & {
	departure: DepartureStatus;
	/** 진행 중이면 마감까지 남은 일수, 개막 예정이면 개막까지 남은 일수 */
	days: number;
	/** 진행 중이면 마감일, 개막 예정이면 개막일 (MM.DD) */
	boardDate: string;
};

interface PickDepartureRowsOptions {
	base?: Date;
	excludeIds?: string[];
}

/**
 * 출발 안내판 행 — last call 3 · boarding 3 · on time 2개를 각각 가까운 순으로 고른다.
 * nearest는 가장 가까운 last call 일수와 그 날 떠나는 전시 수 (last call이 없으면 null)
 */
export const pickDepartureRows = <T extends ExhibitionDates & { id: string }>(
	sources: T[][],
	{ base = new Date(), excludeIds = [] }: PickDepartureRowsOptions = {},
): { rows: DepartureRow<T>[]; nearest: { daysLeft: number; count: number } | null } => {
	const seen = new Set(excludeIds);
	const buckets: Record<DepartureStatus, DepartureRow<T>[]> = {
		'last-call': [],
		boarding: [],
		'on-time': [],
	};

	for (const item of sources.flat()) {
		if (seen.has(item.id)) continue;
		const dates = toDates(item);
		if (dates === null) continue;

		const status = getExhibitionStatus(dates, base);
		if (status === 'upcoming') {
			const days = Math.round(
				(parseDate(dates.startDate).getTime() - startOfDay(base).getTime()) / DAY_MS,
			);
			seen.add(item.id);
			buckets['on-time'].push({
				...item,
				departure: 'on-time',
				days,
				boardDate: formatBoardDate(dates.startDate),
			});
			continue;
		}

		const daysLeft = getDaysLeft(dates, base);
		// 마감일 당일은 철수 중일 수 있어 안내판에 올리지 않는다
		if (daysLeft === null || daysLeft < CLOSING_SOON_MIN_DAYS) continue;
		const departure = daysLeft <= LAST_CALL_MAX_DAYS ? 'last-call' : 'boarding';
		seen.add(item.id);
		buckets[departure].push({
			...item,
			departure,
			days: daysLeft,
			boardDate: formatBoardDate(dates.endDate),
		});
	}

	const byDays = (a: DepartureRow<T>, b: DepartureRow<T>) => a.days - b.days;
	const lastCalls = buckets['last-call'].sort(byDays);
	const nearestDays = lastCalls[0]?.days;

	return {
		rows: (['last-call', 'boarding', 'on-time'] as const).flatMap((key) =>
			buckets[key].sort(byDays).slice(0, DEPARTURE_QUOTA[key]),
		),
		nearest:
			nearestDays === undefined
				? null
				: { daysLeft: nearestDays, count: lastCalls.filter((r) => r.days === nearestDays).length },
	};
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 홈 마스트헤드 날짜 — "2026. 10. 9 목요일" */
export const formatHomeDate = (date: Date): string =>
	`${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()} ${WEEKDAYS[date.getDay()]}요일`;

/** 날짜(로컬 자정 기준)마다 하루씩 넘어가는 순환 인덱스 */
export const getDailyIndex = (base: Date, length: number): number => {
	if (length <= 0) return 0;
	const day = startOfDay(base);
	const dayNumber = Math.round((day.getTime() - day.getTimezoneOffset() * 60 * 1000) / DAY_MS);
	return ((dayNumber % length) + length) % length;
};
