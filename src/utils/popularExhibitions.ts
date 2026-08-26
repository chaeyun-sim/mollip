import type { ExhibitionSummary } from '@/src/hooks/useExploreScreenData';

export interface PopularEntry {
	exhibitionId: string;
	score: number;
}

/** 집계 RPC에서 가져올 최대 건수 (AC-5) */
export const POPULAR_RANKING_LIMIT = 20;

/** 홈 섹션에 노출할 최대 카드 수 (AC-6) */
export const POPULAR_SECTION_SIZE = 10;

interface BuildPopularExhibitionsParams {
	entries: PopularEntry[];
	/** exhibition_id → 표시 정보. 없는 ID는 섹션에서 제외된다. */
	displayById: Map<string, ExhibitionSummary>;
	/** 상위 몇 건까지 노출할지 */
	limit?: number;
	/** 중복 노출을 피하기 위해 제외할 ID (예: FeaturedCarousel 노출 중인 전시) */
	excludeIds?: string[];
}

function compareIds(a: string, b: string): number {
	if (a === b) return 0;

	if (a < b) return -1;

	return 1;
}

/**
 * 인기 점수 내림차순 정렬. 동점이면 exhibition_id 오름차순으로 고정해
 * 매 호출마다 같은 순서가 되도록 한다 (AC-5).
 */
export function sortPopularEntries(entries: PopularEntry[]): PopularEntry[] {
	return [...entries].sort((a, b) => {
		if (a.score !== b.score) return b.score - a.score;

		return compareIds(a.exhibitionId, b.exhibitionId);
	});
}

/**
 * 집계 결과에 표시 정보를 결합해 홈 섹션에 그릴 카드 목록을 만든다.
 * - 표시 정보를 찾지 못한 ID는 제외한다(전시 마스터 부재 — 01-spec Risks P1).
 * - 중복 ID는 첫 번째만 남긴다.
 */
export function buildPopularExhibitions({
	entries,
	displayById,
	limit = POPULAR_SECTION_SIZE,
	excludeIds = [],
}: BuildPopularExhibitionsParams): ExhibitionSummary[] {
	const excluded = new Set(excludeIds);
	const seen = new Set<string>();
	const result: ExhibitionSummary[] = [];

	for (const entry of sortPopularEntries(entries)) {
		if (result.length >= limit) break;

		if (excluded.has(entry.exhibitionId)) continue;

		if (seen.has(entry.exhibitionId)) continue;

		const display = displayById.get(entry.exhibitionId);

		if (!display) continue;

		seen.add(entry.exhibitionId);
		result.push(display);
	}

	return result;
}
