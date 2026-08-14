import { useEffect, useMemo, useState } from 'react';

import type { RecommendableItem } from '@/src/components/explore/ExploreHomeSections';
import { todayExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { supabase } from '@/src/utils/supabase';

// @MX:NOTE: 온보딩 취향 기반 가중치 스코어링 알고리즘 (SPEC-UI-002 REQ-UI002-011)
// @MX:SPEC: SPEC-UI-002

const MAX_RECOMMENDED = 5;
const FETCH_LIMIT = 100;
const FRESHNESS_DAYS = 7;

interface ExhibitionRow {
	id: string | number;
	title: string;
	venue_name_fallback: string;
	image_url: string | null;
	genre: string | null;
	synced_at: string | null;
}

// @MX:ANCHOR: RecommendableItem을 반환하는 공개 훅 — index.tsx에서 직접 소비
// @MX:REASON: 홈 화면 추천 섹션의 단일 데이터 소스
export interface UseRecommendedExhibitionsResult {
	items: RecommendableItem[];
	isPersonalized: boolean;
}

function scoreExhibition(
	row: ExhibitionRow,
	preferredGenres: string[],
	visitedSet: Set<string>,
	bookmarkedSet: Set<string>,
): number {
	let score = 0;

	// 장르 매칭 +40pt (REQ-UI002-011)
	if (row.genre && preferredGenres.includes(row.genre)) score += 40;


	// 신선도 +20pt: synced_at 기준 최근 7일 이내 (REQ-UI002-011)
	if (row.synced_at) {
		const freshCutoff = new Date();
		freshCutoff.setDate(freshCutoff.getDate() - FRESHNESS_DAYS);
		if (new Date(row.synced_at) >= freshCutoff) score += 20;
	}

	// 방문/저장 페널티 -10pt (REQ-UI002-007, REQ-UI002-011)
	const id = String(row.id);
	if (visitedSet.has(id) || bookmarkedSet.has(id)) score -= 10;

	return score;
}

function toRecommendableItem(row: ExhibitionRow): RecommendableItem {
	return {
		id: String(row.id),
		title: row.title.trim(),
		venue: row.venue_name_fallback.trim(),
		thumbnail: row.image_url,
	};
}

export function useRecommendedExhibitions(
	preferredGenres: string[],
	preferredArtists: string[],
	visitedIds: string[],
	bookmarkedIds: string[],
): UseRecommendedExhibitionsResult {
	const [rows, setRows] = useState<ExhibitionRow[]>([]);

	// 선호 데이터 존재 여부 (REQ-UI002-008, REQ-UI002-009, REQ-UI002-010)
	const isPersonalized = preferredGenres.length > 0 || preferredArtists.length > 0;

	useEffect(() => {
		let query = supabase
			.from('exhibitions')
			.select('id, title, venue_name_fallback, image_url, genre, synced_at, end_date')
			.gte('end_date', todayExhibitionDateString())
			.order('synced_at', { ascending: false })
			.limit(FETCH_LIMIT);

		// 선호 장르가 있으면 서버에서 사전 필터링 — 불필요한 행 전송 방지
		if (preferredGenres.length > 0) {
			query = query.in('genre', preferredGenres);
		}

		query.then(({ data, error }) => {
			if (error) {
				console.error('[useRecommendedExhibitions] fetch failed:', error.message);
				return;
			}
			if (data) setRows(data as ExhibitionRow[]);
		});
	}, [preferredGenres]);

	const items = useMemo((): RecommendableItem[] => {
		if (rows.length === 0) return [];

		// 선호 데이터 없으면 기존 소스 순서 유지 (REQ-UI002-008)
		if (!isPersonalized) {
			return rows.slice(0, MAX_RECOMMENDED).map(toRecommendableItem);
		}

		const visitedSet = new Set(visitedIds);
		const bookmarkedSet = new Set(bookmarkedIds);

		return [...rows]
			.map((row) => ({
				row,
				score: scoreExhibition(row, preferredGenres, visitedSet, bookmarkedSet),
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_RECOMMENDED)
			.map(({ row }) => toRecommendableItem(row));
	}, [rows, preferredGenres, visitedIds, bookmarkedIds, isPersonalized]);

	return { items, isPersonalized };
}
