import { WEEKDAYS } from '@/src/constants/week';

export type DayName = (typeof WEEKDAYS)[number];

export interface HoursEntry {
	days: string;
	hours: string;
	isClosed: boolean;
}

export function expandDayLabel(label: string): DayName[] {
	const rangeMatch = label.match(/^([월화수목금토일])~([월화수목금토일])$/);
	if (rangeMatch) {
		const start = WEEKDAYS.indexOf(rangeMatch[1] as DayName);
		const end = WEEKDAYS.indexOf(rangeMatch[2] as DayName);
		if (start !== -1 && end !== -1) return Array.from(WEEKDAYS).slice(start, end + 1) as DayName[];
	}
	return label.split(/[·,]/).map((d) => d.trim()) as DayName[];
}

export function parseHoursEntries(openHours: string, closedDays?: string): HoursEntry[] {
	if (!openHours || openHours.includes('정보 없음')) return [];
	const entries: HoursEntry[] = openHours
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.map((line) => {
			const m = line.match(/^([월화수목금토일,·~]+)\s*:\s*(.+)$/);
			if (m) return { days: m[1].replace(/,/g, '·'), hours: m[2].trim(), isClosed: false };
			return { days: '매일', hours: line, isClosed: false };
		});
	if (closedDays)
		entries.push({ days: closedDays.replace(/,/g, '·'), hours: '휴무', isClosed: true });
	return entries;
}

export function getTodayEntry(entries: HoursEntry[], date: Date): HoursEntry | null {
	const dayName = WEEKDAYS[date.getDay()];
	for (const entry of entries) {
		if (entry.days === '매일') return entry;
		if (expandDayLabel(entry.days).includes(dayName)) return entry;
	}
	return null;
}
