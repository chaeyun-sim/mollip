import { searchWikiArtworks } from '@/src/api/wikidata';
import { supabase } from '@/src/utils/supabase';
import type { Artwork } from '@/src/data/exhibitions';

const FALLBACK_COLORS = ['#C9B99B', '#A9BFC9', '#C9A9AF', '#B7C9A9'];

interface CachedArtwork {
	id: string;
	title: string;
	year?: string;
	imageUri: string;
	description?: string;
}

function toArtworks(artist: string, cached: CachedArtwork[]): Artwork[] {
	return cached.map((c, i) => ({
		id: c.id,
		title: c.title,
		artist,
		year: c.year,
		thumbnailColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
		imageUri: c.imageUri,
		description: c.description,
	}));
}

// artist_artworks 캐시 조회 — 실패해도(테이블 문제 등) 캐시 미스로 취급해 라이브 검색으로 넘어간다.
async function readCache(artist: string): Promise<CachedArtwork[] | null> {
	try {
		const { data } = await supabase
			.from('artist_artworks')
			.select('artworks')
			.eq('artist', artist)
			.maybeSingle();
		return (data?.artworks as CachedArtwork[] | undefined) ?? null;
	} catch {
		return null;
	}
}

// 캐시 저장은 응답을 기다리지 않는다(fire-and-forget) — 다음 조회부터 빨라지면 되는 것이지,
// 이번 요청이 저장 완료를 기다릴 필요는 없다.
function writeCache(artist: string, artworks: CachedArtwork[]) {
	supabase
		.from('artist_artworks')
		.upsert({ artist, artworks: artworks as unknown as import('@/src/types/database.types').Json, updated_at: new Date().toISOString() })
		.then(() => {});
}

// 작가명으로 대표작을 찾아 "관련 추천 작품" 섹션에 채운다. Supabase에 캐싱된 결과가 있으면
// 그걸 바로 쓰고, 없으면 Wikidata를 조회한 뒤 다음번을 위해 캐싱해 둔다.
// 작가 정보가 없는 전시(대부분의 API 소스)는 신뢰할 만한 검색어가 없어 건너뛴다.
export async function fetchArtworksForExhibition(artist: string | undefined): Promise<Artwork[]> {
	if (!artist) return [];
	const key = artist.trim();
	if (!key) return [];

	const cached = await readCache(key);
	if (cached) return toArtworks(key, cached);

	try {
		const results = await searchWikiArtworks(key);
		// 이미지가 없는 항목은 범용 플레이스홀더(다른 화가의 그림)로 대체되어 오해를 살 수
		// 있으므로 제외한다 — 없는 것이 잘못된 것보다 낫다.
		const cacheRows: CachedArtwork[] = results
			.filter((w) => !!w.imageUrl)
			.slice(0, 4)
			.map((w) => ({
				id: w.qId,
				title: w.label,
				year: w.year,
				imageUri: w.imageUrl!,
				description: w.description || undefined,
			}));

		writeCache(key, cacheRows);
		return toArtworks(key, cacheRows);
	} catch {
		return [];
	}
}
