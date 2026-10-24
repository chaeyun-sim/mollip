import type { ArtworkSearchResult } from '@/src/types/artwork';

const SEARCH_URL = 'https://api.artic.edu/api/v1/artworks/search';
const IIIF_BASE = 'https://www.artic.edu/iiif/2';

// AIC는 검색 한 번으로 필요한 필드를 전부 받을 수 있어 Met처럼 상세 조회가 따로 없다.
const SEARCH_LIMIT = 12;

interface AicArtwork {
	id: number;
	title?: string;
	artist_display?: string;
	date_display?: string;
	image_id?: string | null;
}

interface AicSearchResponse {
	data: AicArtwork[];
}

function iiifImageUrl(imageId: string): string {
	return `${IIIF_BASE}/${imageId}/full/843,/0/default.jpg`;
}

function parseArtwork(a: AicArtwork): ArtworkSearchResult | null {
	if (!a.title) return null;
	return {
		id: `aic:${a.id}`,
		source: 'aic',
		label: a.title,
		description: a.artist_display ?? '',
		imageUrl: a.image_id ? iiifImageUrl(a.image_id) : undefined,
		year: a.date_display || undefined,
		artist: a.artist_display || undefined,
	};
}

export async function searchAicArtworks(query: string): Promise<ArtworkSearchResult[]> {
	const params = new URLSearchParams({
		q: query,
		fields: 'id,title,artist_display,date_display,image_id',
		limit: String(SEARCH_LIMIT),
	});
	const response = await fetch(`${SEARCH_URL}?${params}`);
	if (!response.ok) throw new Error(`aic-search ${response.status}`);

	const { data } = (await response.json()) as AicSearchResponse;
	return data.map(parseArtwork).filter((a): a is ArtworkSearchResult => a != null);
}
