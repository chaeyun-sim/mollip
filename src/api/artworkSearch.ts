import { searchWikiArtworks } from '@/src/api/wikidata';
import { searchMetArtworks } from '@/src/api/met';
import type { ArtworkSearchResult } from '@/src/types/artwork';

// 제목+작가가 사실상 같은 작품이 여러 소스에서 중복으로 잡힐 때 걸러내기 위한 키.
const dedupeKey = (label: string, artist?: string): string =>
	`${label.trim().toLowerCase()}::${(artist ?? '').trim().toLowerCase()}`;

/**
 * Wikidata + Met을 동시에 검색해 하나의 결과 리스트로 합친다.
 * 한쪽 소스가 실패하거나 느려도 나머지 결과는 그대로 보여준다(Promise.allSettled).
 * SeMA API 키가 발급되면 여기에 searchSemaArtworks(query) 호출 한 줄만 추가하면 된다.
 */
export async function searchArtworks(query: string): Promise<ArtworkSearchResult[]> {
	const [wikidataResult, metResult] = await Promise.allSettled([
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
	]);

	const combined = [
		...(wikidataResult.status === 'fulfilled' ? wikidataResult.value : []),
		...(metResult.status === 'fulfilled' ? metResult.value : []),
	];

	const seen = new Set<string>();
	return combined.filter((artwork) => {
		const key = dedupeKey(artwork.label, artwork.artist);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
