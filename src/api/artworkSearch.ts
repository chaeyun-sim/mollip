import { searchWikiArtworks } from '@/src/api/wikidata';
import { searchMetArtworks } from '@/src/api/met';
import { searchAicArtworks } from '@/src/api/aic';
import { searchEuropeanaArtworks } from '@/src/api/europeana';
import type { ArtworkSearchResult } from '@/src/types/artwork';

// 제목+작가가 사실상 같은 작품이 여러 소스에서 중복으로 잡힐 때 걸러내기 위한 키.
const dedupeKey = (label: string, artist?: string): string =>
	`${label.trim().toLowerCase()}::${(artist ?? '').trim().toLowerCase()}`;

const matchesQuery = (artwork: ArtworkSearchResult, query: string): boolean => {
	const normalizedQuery = query.trim().toLocaleLowerCase();
	return [artwork.label, artwork.artist].some((value) =>
		value?.toLocaleLowerCase().includes(normalizedQuery),
	);
};

/**
 * Wikidata + Met + AIC + Europeana를 동시에 검색해 하나의 결과 리스트로 합친다.
 * 한쪽 소스가 실패하거나 느려도 나머지 결과는 그대로 보여준다(Promise.allSettled).
 * Europeana는 API 키(EXPO_PUBLIC_EUROPEANA_SPI)가 없으면 빈 배열을 반환한다.
 * SeMA API 키가 발급되면 여기에 searchSemaArtworks(query) 호출 한 줄만 추가하면 된다.
 */
export async function searchArtworks(query: string): Promise<ArtworkSearchResult[]> {
	const [wikidataResult, metResult, aicResult, europeanaResult] = await Promise.allSettled([
		searchWikiArtworks(query).then((artworks) =>
			artworks.map((a): ArtworkSearchResult => ({
				id: `wikidata:${a.qId}`,
				source: 'wikidata',
				label: a.label,
				description: a.description,
				imageUrl: a.imageUrl,
				year: a.year,
				artist: a.artist,
			})),
		),
		searchMetArtworks(query),
		searchAicArtworks(query),
		searchEuropeanaArtworks(query),
	]);

	const combined = [
		...(wikidataResult.status === 'fulfilled' ? wikidataResult.value : []),
		...(metResult.status === 'fulfilled' ? metResult.value : []),
		...(aicResult.status === 'fulfilled' ? aicResult.value : []),
		...(europeanaResult.status === 'fulfilled' ? europeanaResult.value : []),
	];

	const seen = new Set<string>();
	return combined.filter((artwork) => {
		if (!matchesQuery(artwork, query)) return false;
		const key = dedupeKey(artwork.label, artwork.artist);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
