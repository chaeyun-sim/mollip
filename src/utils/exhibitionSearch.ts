import { EXHIBITIONS, type Exhibition } from '../data/exhibitions';
import { parseDate } from './mapUtils';

export type ExhibitionStatus = 'upcoming' | 'ongoing' | 'ended';

export const STATUS_LABELS: Record<ExhibitionStatus, string> = {
	upcoming: '예정',
	ongoing: '진행 중',
	ended: '마감',
};

/** 기준 날짜 대비 전시 진행 상태 */
export function getExhibitionStatus(ex: Exhibition, base: Date = new Date()): ExhibitionStatus {
	const d = new Date(base);
	d.setHours(0, 0, 0, 0);
	const start = parseDate(ex.startDate);
	const end = parseDate(ex.endDate);
	end.setHours(23, 59, 59, 999);
	if (d < start) return 'upcoming';
	if (d > end) return 'ended';
	return 'ongoing';
}

/** 검색어가 제목·미술관·작가·태그 중 하나라도 매칭되는지 */
export function matchesQuery(ex: Exhibition, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	const haystack = [ex.title, ex.venue, ex.artist ?? '', ...(ex.tags ?? [])]
		.join(' ')
		.toLowerCase();
	return haystack.includes(q);
}

/** 제외어가 하나라도 포함되면 true (검색 결과에서 걸러냄) */
export function matchesExcluded(ex: Exhibition, excluded: string[]): boolean {
	if (excluded.length === 0) return false;
	const haystack = [ex.title, ex.venue, ex.artist ?? '', ex.description, ...(ex.tags ?? [])]
		.join(' ')
		.toLowerCase();
	return excluded.some((word) => haystack.includes(word.trim().toLowerCase()));
}

/** 종료일까지 남은 일수 (오늘 마감 = 0, 이미 종료 = 음수) */
export function daysUntilEnd(ex: Exhibition, base: Date = new Date()): number {
	const d = new Date(base);
	d.setHours(0, 0, 0, 0);
	const end = parseDate(ex.endDate);
	return Math.round((end.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

/** 진행 중 + 마감 임박(D-7 이내)일 때만 D-day 라벨, 아니면 null */
export function getDdayLabel(ex: Exhibition, base: Date = new Date()): string | null {
	if (getExhibitionStatus(ex, base) !== 'ongoing') return null;
	const days = daysUntilEnd(ex, base);
	if (days > 7) return null;
	return days === 0 ? '오늘 마감' : `마감 D-${days}`;
}

/** 전시 태그를 빈도순으로 집계해 상위 N개 반환 */
export function getPopularTags(limit: number, exhibitions: Exhibition[] = EXHIBITIONS): string[] {
	const counts = new Map<string, number>();
	for (const ex of exhibitions) {
		for (const tag of ex.tags ?? []) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return Array.from(counts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([tag]) => tag);
}

/** 지정 날짜에 관람 가능한 전시인지 (시작일~종료일 사이) */
export function isViewableOn(ex: Exhibition, date: Date): boolean {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	const start = parseDate(ex.startDate);
	const end = parseDate(ex.endDate);
	end.setHours(23, 59, 59, 999);
	return d >= start && d <= end;
}
