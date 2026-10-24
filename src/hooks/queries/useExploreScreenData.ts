import { useMemo } from 'react';
import { useCultureExhibitions } from '@/src/hooks/queries/useCultureExhibitions';
import { useKcisaExhibitions } from '@/src/hooks/queries/useKcisaExhibitions';
import { useRecommendedExhibitions } from '@/src/hooks/queries/useRecommendedExhibitions';
import { usePreferences } from '@/src/hooks/queries/usePreferences';
import { useAuthStore } from '@/src/store/authStore';
import { toAsyncStatus } from '@/src/types/asyncStatus.types';
import type { ExhibitionStatus } from '@/src/utils/exhibitionSearch';

export type ExhibitionSummary = {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
	/** YYYY.MM.DD — 홈 카드의 D-day·기간 라벨용 (소스에 없으면 생략) */
	startDate?: string | null;
	endDate?: string | null;
};

export type FeaturedExhibition = ExhibitionSummary & {
	source: 'kcisa' | 'culture';
};

const FEATURED_CAROUSEL_SIZE = 5;

const withListQuery = <TItem, TQuery extends { isLoading: boolean; isError: boolean }>(
	query: TQuery,
	items: TItem[],
) => ({
	...query,
	items,
	status: toAsyncStatus(query.isLoading, query.isError),
});

const toFeaturedCarousel = (
	items: ExhibitionSummary[],
	source: FeaturedExhibition['source'],
): FeaturedExhibition[] =>
	items.slice(0, FEATURED_CAROUSEL_SIZE).map((item) => ({
		source,
		id: item.id,
		title: item.title,
		venue: item.venue,
		thumbnail: item.thumbnail,
		status: item.status,
	}));

const withoutFeatured = (
	items: ExhibitionSummary[],
	source: FeaturedExhibition['source'],
	featured: FeaturedExhibition | null,
	featuredCount: number,
): ExhibitionSummary[] => {
	if (featured?.source !== source) return items;
	return items.slice(featuredCount);
};

/**
 * 탐색 홈 데이터를 조율하는 조합 훅.
 * 자체 fetch는 없고, 쿼리 훅·스토어 결과를 featured/캐러셀/추천으로 파생한다.
 */
export function useExploreScreenData() {
	const userId = useAuthStore((s) => s.user?.id);

	const { data: cultureItems = [], ...cultureQuery } = useCultureExhibitions();

	const { data: kcisaItems = [], ...kcisaQuery } = useKcisaExhibitions();

	const {
		preferredGenres,
		preferredArtists,
		preferredTasteDetails,
		isLoading: preferencesLoading,
		isError: preferencesError,
	} = usePreferences(userId);

	const featuredCarousel = useMemo<FeaturedExhibition[]>(() => {
		if (kcisaItems.length > 0) return toFeaturedCarousel(kcisaItems, 'kcisa');
		if (cultureItems.length > 0) return toFeaturedCarousel(cultureItems, 'culture');
		return [];
	}, [kcisaItems, cultureItems]);

	const featured = featuredCarousel[0] ?? null;

	const kcisaCarousel = useMemo(
		() => withoutFeatured(kcisaItems, 'kcisa', featured, featuredCarousel.length),
		[kcisaItems, featured, featuredCarousel.length],
	);

	// 전시 정보 텍스트에서 작가명이 확인되는 경우에도 개인화 추천을 제공한다.
	const isPersonalized =
		preferredGenres.length > 0 ||
		preferredArtists.length > 0 ||
		preferredTasteDetails.moods.length > 0 ||
		preferredTasteDetails.venueScales.length > 0 ||
		preferredTasteDetails.artMovements.length > 0;

	const {
		data: recommendedItems = [],
		isLoading: recommendationsLoading,
		isError: recommendationsError,
		refetch: refetchRecommendations,
	} = useRecommendedExhibitions(
		preferredGenres,
		preferredArtists,
		preferredTasteDetails,
		isPersonalized,
	);

	return {
		cultureQuery: withListQuery(cultureQuery, cultureItems),
		kcisaQuery: withListQuery(kcisaQuery, kcisaItems),
		featured,
		featuredCarousel,
		kcisaCarousel,
		displayedRecommended: recommendedItems,
		isPersonalized,
		preferredGenres,
		preferencesLoading,
		preferencesError,
		recommendationsLoading,
		recommendationsError,
		refetchRecommendations,
	};
}
