import type { ArtworkSearchResult } from '@/src/types/artwork';

// v1/search는 2026-10-01 폐기(410 Gone) — 페이지네이션(offset/limit)을 받는 v1.1을 쓴다
const SEARCH_URL = 'https://collectionapi.metmuseum.org/public/collection/v1.1/search';
const OBJECT_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

// 상세 조회는 검색 1건보다 훨씬 무겁다 — 검색당 이 개수만큼만 조회해 응답 시간과
// API 부하를 둘 다 억제한다 (Met API는 키 없이 열려있는 대신 예의상 과도한 병렬 요청을 피한다).
const MAX_DETAIL_FETCH = 12;

interface MetSearchResponse {
	total: number;
	objectIDs: number[] | null;
}

interface MetObject {
	objectID: number;
	title?: string;
	artistDisplayName?: string;
	objectDate?: string;
	medium?: string;
	department?: string;
	primaryImageSmall?: string;
	primaryImage?: string;
}

function parseObject(o: MetObject): ArtworkSearchResult | null {
	if (!o.title) return null;
	return {
		id: `met:${o.objectID}`,
		source: 'met',
		label: o.title,
		description: [o.artistDisplayName, o.medium].filter(Boolean).join(' · '),
		imageUrl: o.primaryImageSmall || o.primaryImage || undefined,
		year: o.objectDate || undefined,
		artist: o.artistDisplayName || undefined,
	};
}

/** 단일 작품의 대표 이미지 URL (작은 버전 우선). 이미지가 없으면 null */
export async function getMetObjectImage(objectId: number): Promise<string | null> {
	const response = await fetch(`${OBJECT_URL}/${objectId}`);
	if (!response.ok) throw new Error(`met-object ${response.status}`);
	const object = (await response.json()) as MetObject;
	return object.primaryImageSmall || object.primaryImage || null;
}

export async function searchMetArtworks(query: string): Promise<ArtworkSearchResult[]> {
	// 상세 조회할 개수만큼만 받는다 (v1.1 기본 limit은 100)
	const searchParams = new URLSearchParams({
		q: query,
		hasImages: 'true',
		limit: String(MAX_DETAIL_FETCH),
	});
	const searchResponse = await fetch(`${SEARCH_URL}?${searchParams}`);
	if (!searchResponse.ok) throw new Error(`met-search ${searchResponse.status}`);

	const { objectIDs } = (await searchResponse.json()) as MetSearchResponse;
	if (!objectIDs || objectIDs.length === 0) return [];

	const targetIds = objectIDs.slice(0, MAX_DETAIL_FETCH);
	const objects = await Promise.all(
		targetIds.map(async (id) => {
			try {
				const response = await fetch(`${OBJECT_URL}/${id}`);
				if (!response.ok) return null;
				return (await response.json()) as MetObject;
			} catch {
				return null;
			}
		}),
	);

	return objects
		.filter((o): o is MetObject => o != null)
		.map(parseObject)
		.filter((a): a is ArtworkSearchResult => a != null);
}
