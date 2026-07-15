import type { Exhibition } from '../data/exhibitions';
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

/** 지정 날짜에 관람 가능한 전시인지 (시작일~종료일 사이) */
export function isViewableOn(ex: Exhibition, date: Date): boolean {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	const start = parseDate(ex.startDate);
	const end = parseDate(ex.endDate);
	end.setHours(23, 59, 59, 999);
	return d >= start && d <= end;
}
