import type { ArtworkSearchResult } from '@/src/types/artwork';

const SEARCH_URL = 'https://api.europeana.eu/api/v2/search.json';
const SEARCH_ROWS = 12;

const API_KEY = process.env.EXPO_PUBLIC_EUROPEANA_SPI ?? '';

interface EuropeanaItem {
	id: string;
	title?: string[];
	dcCreator?: string[];
	year?: string[];
	edmPreview?: string[];
	guid?: string;
}

interface EuropeanaSearchResponse {
	success: boolean;
	items?: EuropeanaItem[];
}

// Europeana는 대부분의 메타데이터를 문자열 배열(다국어/다중값)로 내려준다 — 첫 값만 쓴다.
const firstOf = (values?: string[]): string | undefined => values?.[0]?.trim() || undefined;

function parseItem(item: EuropeanaItem): ArtworkSearchResult | null {
	const label = firstOf(item.title);
	if (!label) return null;
	const artist = firstOf(item.dcCreator);
	return {
		id: `europeana:${item.id}`,
		source: 'europeana',
		label,
		description: artist ?? '',
		imageUrl: firstOf(item.edmPreview),
		year: firstOf(item.year),
		artist,
	};
}

export async function searchEuropeanaArtworks(query: string): Promise<ArtworkSearchResult[]> {
	if (!API_KEY) return [];

	const params = new URLSearchParams({
		wskey: API_KEY,
		query,
		qf: 'TYPE:IMAGE',
		reusability: 'open',
		rows: String(SEARCH_ROWS),
	});
	const response = await fetch(`${SEARCH_URL}?${params}`);
	if (!response.ok) throw new Error(`europeana-search ${response.status}`);

	const { success, items } = (await response.json()) as EuropeanaSearchResponse;
	if (!success || !items) return [];

	return items.map(parseItem).filter((a): a is ArtworkSearchResult => a != null);
}
