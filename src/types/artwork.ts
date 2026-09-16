export type ArtworkSource = 'wikidata' | 'met' | 'aic' | 'europeana';

/** 여러 미술 작품 검색 API(Wikidata, Met 등)를 하나의 화면에서 다루기 위한 공통 결과 형태. */
export interface ArtworkSearchResult {
	/** 소스 접두어를 붙인 고유 id (예: `wikidata:Q12418`, `met:436535`) */
	id: string;
	source: ArtworkSource;
	label: string;
	description: string;
	imageUrl?: string;
	year?: string;
	artist?: string;
}
