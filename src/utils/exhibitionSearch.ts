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

export function isValidExhibitionDateString(
	value: string | null | undefined,
): boolean {
	return typeof value === 'string' && EXHIBITION_DATE_RE.test(value.trim());
}

export function hasValidExhibitionDates(
	ex: Pick<Exhibition, 'startDate' | 'endDate'>,
): boolean {
	return (
		isValidExhibitionDateString(ex.startDate) &&
		isValidExhibitionDateString(ex.endDate)
	);
}

/** 기준 날짜 대비 전시 진행 상태 (날짜 없/형식 오류 → 마감 취급) */
export function getExhibitionStatus(
	ex: Exhibition,
	base: Date = new Date(),
): ExhibitionStatus {
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

export function isExhibitionEnded(
	ex: Exhibition,
	base: Date = new Date(),
): boolean {
	return getExhibitionStatus(ex, base) === 'ended';
}

/** 목록·검색·지도 등 사용자-facing 노출 대상 */
export function isExhibitionListed(
	ex: Exhibition,
	base: Date = new Date(),
): boolean {
	return hasValidExhibitionDates(ex) && !isExhibitionEnded(ex, base);
}

/** Supabase — 빈 start/end 제외 (YYYY.MM.DD 형식은 클라이언트에서 추가 검증) */
export function applyExhibitionDateFilters<T>(query: T): T {
	// @ts-expect-error — PostgrestFilterBuilder 재귀 제네릭 깊이 회피
	return query.neq('start_date', '').neq('end_date', '');
}

// @MX:NOTE: ex.artist는 supabase exhibitions 테이블에 없어 항상 undefined — 작가 검색은 현재 동작하지 않음
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

/** 진행 중일 때 D-day 라벨 반환. maxDays 이내일 때만 표시 (기본 7일) */
export function getDdayLabel(
	ex: Exhibition,
	base?: Date,
	maxDays?: number,
): string | null;
/** @deprecated base를 두 번째 인자로 쓰는 구형 시그니처 */
export function getDdayLabel(ex: Exhibition, base: Date): string | null;
export function getDdayLabel(
	ex: Exhibition,
	baseOrMaxDays?: Date | number,
	maxDays = 7,
): string | null {
	const base = baseOrMaxDays instanceof Date ? baseOrMaxDays : new Date();
	const effectiveMax =
		typeof baseOrMaxDays === 'number' ? baseOrMaxDays : maxDays;
	if (getExhibitionStatus(ex, base) !== 'ongoing') return null;
	const days = daysUntilEnd(ex, base);
	if (days > effectiveMax) return null;
	return days === 0 ? '오늘 마감' : `D-${days}`;
}

/** 전시 태그를 빈도순으로 집계해 상위 N개 반환 */
export function getPopularTags(
	limit: number,
	exhibitions: Exhibition[] = EXHIBITIONS,
): string[] {
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
