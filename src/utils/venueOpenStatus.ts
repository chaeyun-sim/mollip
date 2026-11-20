import { WEEKDAYS } from '@/src/constants/week';

/** 화면 문구는 호출부에서 번역한다 — 여기서는 한국어 원본 데이터를 해석해 상태만 돌려준다 */
export type VenueOpenStatus =
	| { kind: 'closed-today' }
	| { kind: 'no-info' }
	| { kind: 'raw'; text: string }
	| { kind: 'open' | 'closed'; hours: string };

export interface WeeklyHoursEntry {
	/** Date.getDay() 기준 요일 인덱스 (0 = 일요일) */
	dayIndex: number;
	/** "10:00-21:00" 형식, 찾지 못하면 null */
	hours: string | null;
	isClosed: boolean;
}

const HOURS_PATTERN = /(\d{1,2}:\d{2})\s*[~–-]\s*(\d{1,2}:\d{2})/;
/** 월요일부터 일요일 순서의 Date.getDay() 인덱스 */
const MONDAY_FIRST_DAY_INDEXES = [1, 2, 3, 4, 5, 6, 0];

const includesDay = (label: string | undefined, dayName: string): boolean => {
	const normalized = label?.replace(/\s/g, '').replace(/요일/g, '') ?? '';
	if (!normalized || normalized === '없음' || normalized === '-') return false;
	if (normalized.includes('매일') || normalized.includes('연중무휴')) return true;
	if (normalized.includes('평일')) return ['월', '화', '수', '목', '금'].includes(dayName);
	if (normalized.includes('주말')) return ['토', '일'].includes(dayName);
	return normalized
		.split(/[,\s·/]+/)
		.map((item) => item.trim())
		.some((item) => item.includes(dayName));
};

const findHoursForDay = (openHours: string, dayName: string): string | null => {
	const lines = openHours
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	for (const line of lines) {
		const match = line.match(HOURS_PATTERN);
		if (!match) continue;
		const label = line.slice(0, match.index).replace(/[:：]/g, '').trim();
		if (!label || includesDay(label, dayName)) return `${match[1]}-${match[2]}`;
	}

	const fallback = openHours.match(HOURS_PATTERN);
	return fallback ? `${fallback[1]}-${fallback[2]}` : null;
};

const hasClosingTimePassed = (hours: string, date: Date, now: Date): boolean => {
	const isToday =
		now.getFullYear() === date.getFullYear() &&
		now.getMonth() === date.getMonth() &&
		now.getDate() === date.getDate();
	if (!isToday) return false;

	const [closingHour, closingMinute] = (hours.split('-')[1] ?? '').split(':').map(Number);
	if (!Number.isFinite(closingHour) || !Number.isFinite(closingMinute)) return false;

	return now.getHours() * 60 + now.getMinutes() >= closingHour * 60 + closingMinute;
};

/** 선택한 날짜의 운영 상태 — 휴관 / 정보 없음 / 원문 / 운영 중·마감 + 시간 */
export const getOpenStatus = (
	openHours: string,
	closedDays: string | undefined,
	date: Date,
	now: Date = new Date(),
): VenueOpenStatus => {
	const dayName = WEEKDAYS[date.getDay()];
	if (includesDay(closedDays, dayName)) return { kind: 'closed-today' };
	if (!openHours || openHours.includes('정보 없음')) return { kind: 'no-info' };

	const hours = findHoursForDay(openHours, dayName);
	if (!hours) return { kind: 'raw', text: openHours };

	return {
		kind: hasClosingTimePassed(hours, date, now) ? 'closed' : 'open',
		hours: hours.replace('-', '–'),
	};
};

/** 월요일부터 일요일까지 요일별 운영시간 */
export const buildWeeklyHours = (
	openHours: string,
	closedDays: string | undefined,
): WeeklyHoursEntry[] =>
	MONDAY_FIRST_DAY_INDEXES.map((dayIndex) => {
		const dayName = WEEKDAYS[dayIndex];
		if (includesDay(closedDays, dayName)) return { dayIndex, hours: null, isClosed: true };
		return { dayIndex, hours: findHoursForDay(openHours, dayName), isClosed: false };
	});
