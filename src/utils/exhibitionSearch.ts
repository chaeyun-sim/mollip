import { EXHIBITIONS, type Exhibition } from '../data/exhibitions';
import { EXHIBITION_TYPE_VALUES } from '@/src/constants/exhibitionTaxonomy';
import { displayGenre } from '@/src/utils/exhibitionClassification';
import { parseDate } from './mapUtils';

/** 태그로 노출할 만한 "진짜" 장르 값일 때만 반환, 아니면 null. */
export function getGenreTag(ex: Exhibition): string | null {
	return displayGenre(ex.genre);
}

/** DB type → (레거시) tags → 기간 휴리스틱 */
export function getExhibitionTypeDisplay(ex: Exhibition): string {
	const fromColumn = ex.exhibitionType?.trim();
	if (fromColumn) return fromColumn;
	const fromTags = ex.tags?.find((t) => EXHIBITION_TYPE_VALUES.has(t));
	if (fromTags) return fromTags;
	return getExhibitionTypeLabel(ex);
}

export type ExhibitionStatus = 'upcoming' | 'ongoing' | 'ended';

export const STATUS_LABELS: Record<ExhibitionStatus, string> = {
	upcoming: '예정',
	ongoing: '진행 중',
	ended: '마감',
};

/** Supabase `start_date` / `end_date` (YYYY.MM.DD) */
export const EXHIBITION_DATE_RE = /^\d{4}\.\d{2}\.\d{2}$/;

export function isValidExhibitionDateString(value: string | null | undefined): boolean {
	return typeof value === 'string' && EXHIBITION_DATE_RE.test(value.trim());
}

export function hasValidExhibitionDates(
	ex: Pick<Exhibition, 'startDate' | 'endDate'>,
): boolean {
	return (
		isValidExhibitionDateString(ex.startDate) && isValidExhibitionDateString(ex.endDate)
	);
}

/** 기준 날짜 대비 전시 진행 상태 (날짜 없/형식 오류 → 마감 취급) */
export function getExhibitionStatus(ex: Exhibition, base: Date = new Date()): ExhibitionStatus {
	if (!hasValidExhibitionDates(ex)) return 'ended';
	const d = new Date(base);
	d.setHours(0, 0, 0, 0);
	const start = parseDate(ex.startDate);
	const end = parseDate(ex.endDate);
	end.setHours(23, 59, 59, 999);
	if (d < start) return 'upcoming';
	if (d > end) return 'ended';
	return 'ongoing';
}

export function todayExhibitionDateString(base: Date = new Date()): string {
	const d = new Date(base);
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function isExhibitionEnded(ex: Exhibition, base: Date = new Date()): boolean {
	return getExhibitionStatus(ex, base) === 'ended';
}

/** 목록·검색·지도 등 사용자-facing 노출 대상 */
export function isExhibitionListed(ex: Exhibition, base: Date = new Date()): boolean {
	return hasValidExhibitionDates(ex) && !isExhibitionEnded(ex, base);
}

/** Supabase — 빈 start/end 제외 (YYYY.MM.DD 형식은 클라이언트에서 추가 검증) */
export function applyExhibitionDateFilters<T>(query: T): T {
	// @ts-expect-error — PostgrestFilterBuilder 재귀 제네릭 깊이 회피
	return query.neq('start_date', '').neq('end_date', '');
}

/** 검색어가 제목·미술관·작가·태그 중 하나라도 매칭되는지 */
export function matchesQuery(ex: Exhibition, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	const haystack = [
		ex.title,
		ex.venue,
		ex.artist ?? '',
		ex.exhibitionType ?? '',
		...(ex.tags ?? []),
	]
		.join(' ')
		.toLowerCase();
	return haystack.includes(q);
}

/** 제외어가 하나라도 포함되면 true (검색 결과에서 걸러냄) */
export function matchesExcluded(ex: Exhibition, excluded: string[]): boolean {
	if (excluded.length === 0) return false;
	const haystack = [
		ex.title,
		ex.venue,
		ex.artist ?? '',
		ex.description,
		ex.exhibitionType ?? '',
		...(ex.tags ?? []),
	]
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

const PERMANENT_EXHIBITION_DAYS = 365;

/** 전시 타입(상설전/특별전) 추정 — API에 실제 타입 필드가 없어, 기간 길이(1년 이상이면
 * 상설전)로 추정하는 휴리스틱. 100% 정확하지 않을 수 있다. */
export function getExhibitionTypeLabel(ex: Exhibition): string {
	const start = parseDate(ex.startDate);
	const end = parseDate(ex.endDate);
	const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
	return days >= PERMANENT_EXHIBITION_DAYS ? '상설전' : '특별전';
}

/** "공성훈, 곽덕준, ..." 처럼 쉼표로 나열된 작가명을 개별 태그로 분리한다.
 * "9인"처럼 인원수만 있고 실제 이름이 없는 경우는 분리할 게 없어 그대로 하나의 태그로 둔다. */
export function splitArtistNames(artist: string | undefined): string[] {
	if (!artist) return [];
	const names = artist
		.split(/[,，·]/)
		.map((n) => n.trim())
		.filter(Boolean);
	return names.length > 0 ? names : [artist.trim()];
}

/** "국립춘천박물관 어린이박물관2층 열린전시실" → "국립춘천박물관" 처럼 장소명 앞부분(기관명)만
 * 태그로 쓴다. venue는 "기관명 + 세부위치"를 공백으로 이어붙인 형태라 첫 단어가 기관명이다. */
export function getShortVenueLabel(venue: string): string {
	return venue.split(' ')[0] || venue;
}

/** 휴무일 정보에 토요일/일요일/주말 언급이 없으면 주말에도 운영하는 것으로 본다
 * (국내 미술관 대부분은 월요일 휴관 + 주말 운영이라 이 가정이 대체로 맞다). */
export function isWeekendOpen(ex: Exhibition): boolean {
	if (!ex.closedDays) return true;
	return !/토요일|일요일|주말/.test(ex.closedDays);
}
