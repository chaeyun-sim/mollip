import { useMemo } from 'react';

import { useCultureExhibitions } from '@/src/hooks/useCultureExhibitions';
import { useKcisaExhibitions } from '@/src/hooks/useKcisaExhibitions';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useRecommendedExhibitions } from '@/src/hooks/useRecommendedExhibitions';
import { useAuthStore } from '@/src/store/authStore';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useVisitStore } from '@/src/store/visitStore';
import type { ExhibitionStatus } from '@/src/utils/exhibitionSearch';

export type ExhibitionSummary = {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
};

export type FeaturedExhibition = ExhibitionSummary & {
	source: 'kcisa' | 'culture';
};

const FEATURED_CAROUSEL_SIZE = 5;

/**
 * 탐색 홈 화면에 필요한 데이터를 조율·파생하는 훅.
 * - 3개 데이터 소스(KCISA·Culture·추천)를 구독하고
 * - featured, 캐러셀, 추천 목록을 단일 인터페이스로 반환한다.
 * (REQ-UI002-002, 005, 008, 009, 010, 011)
 */
export function useExploreScreenData() {
	const userId = useAuthStore((s) => s.user?.id);
	const { items, status, refetch } = useCultureExhibitions();
	const { items: kcisaItems, status: kcisaStatus, refetch: kcisaRefetch } = useKcisaExhibitions();

	const { preferredGenres, preferredArtists } = usePreferences(userId);

	const visits = useVisitStore((s) => s.visits);
	const visitedIds = useMemo(
		() =>
			Object.values(visits)
				.map((v) => v.exhibitionId)
				.filter((id): id is string => id !== null),
		[visits],
	);
	const bookmarkedIds = useBookmarkStore((s) => s.ids);

	const featuredCarousel = useMemo<FeaturedExhibition[]>(() => {
		if (kcisaItems.length > 0) {
			return kcisaItems.slice(0, FEATURED_CAROUSEL_SIZE).map((f) => ({
				source: 'kcisa' as const,
				id: f.id,
				title: f.title,
				venue: f.venue,
				thumbnail: f.thumbnail,
				status: f.status,
			}));
		}
		if (items.length > 0) {
			return items.slice(0, FEATURED_CAROUSEL_SIZE).map((f) => ({
				source: 'culture' as const,
				id: f.id,
				title: f.title,
				venue: f.venue,
				thumbnail: f.thumbnail,
				status: f.status,
			}));
		}
		return [];
	}, [kcisaItems, items]);

	const featured = featuredCarousel[0] ?? null;

	const kcisaCarousel = useMemo<ExhibitionSummary[]>(() => {
		if (featured?.source !== 'kcisa') return kcisaItems;
		return kcisaItems.slice(featuredCarousel.length);
	}, [kcisaItems, featured, featuredCarousel.length]);

	const cultureList = useMemo<ExhibitionSummary[]>(() => {
		if (featured?.source !== 'culture') return items;
		return items.slice(featuredCarousel.length);
	}, [items, featured, featuredCarousel.length]);

	const { items: recommendedItems, isPersonalized } = useRecommendedExhibitions(
		preferredGenres,
		preferredArtists,
		visitedIds,
		bookmarkedIds,
	);

	const displayedRecommended = useMemo<ExhibitionSummary[]>(() => {
		if (recommendedItems.length > 0) return recommendedItems;
		const culturePart = cultureList.slice(0, 5);
		if (culturePart.length >= 5) return culturePart;
		return [...culturePart, ...kcisaCarousel.slice(0, 5 - culturePart.length)];
	}, [recommendedItems, cultureList, kcisaCarousel]);

	return {
		cultureStatus: status,
		refetch,
		kcisaItems,
		kcisaStatus,
		kcisaRefetch,
		featured,
		featuredCarousel,
		kcisaCarousel,
		displayedRecommended,
		isPersonalized,
	};
}
