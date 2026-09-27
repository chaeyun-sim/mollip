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
};

export type FeaturedExhibition = ExhibitionSummary & {
	source: 'kcisa' | 'culture';
};

const FEATURED_CAROUSEL_SIZE = 5;
const RECOMMENDED_FALLBACK_SIZE = 5;

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

	const { preferredGenres } = usePreferences(userId);

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

	const cultureList = useMemo(
		() => withoutFeatured(cultureItems, 'culture', featured, featuredCarousel.length),
		[cultureItems, featured, featuredCarousel.length],
	);

	// preferredArtists는 useRecommendedExhibitions의 스코어링에 반영되지 않는다
	// (exhibitions 테이블에 artist 컬럼이 없음) — 개인화 여부는 장르 선호로만 판단한다.
	const isPersonalized = preferredGenres.length > 0;

	const { data: recommendedItems = [] } = useRecommendedExhibitions(
		preferredGenres,
		isPersonalized,
	);

	const displayedRecommended = useMemo<ExhibitionSummary[]>(() => {
		if (recommendedItems.length > 0) return recommendedItems;
		const culturePart = cultureList.slice(0, RECOMMENDED_FALLBACK_SIZE);
		if (culturePart.length >= RECOMMENDED_FALLBACK_SIZE) return culturePart;
		return [
			...culturePart,
			...kcisaCarousel.slice(0, RECOMMENDED_FALLBACK_SIZE - culturePart.length),
		];
	}, [recommendedItems, cultureList, kcisaCarousel]);

	return {
		cultureQuery: withListQuery(cultureQuery, cultureItems),
		kcisaQuery: withListQuery(kcisaQuery, kcisaItems),
		featured,
		featuredCarousel,
		kcisaCarousel,
		displayedRecommended,
		isPersonalized,
	};
}
