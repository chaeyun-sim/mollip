import { supabase } from '@/src/utils/supabase';

export interface ExhibitionArtistInfo {
	artist: string;
	imageUrl?: string;
}

/**
 * 몰입 대상 전시의 작가명·대표 이미지를 조회한다.
 * artist가 비어 있는 전시(단체전)나 조회 실패는 모두 null로 취급해 기능을 완전히 스킵한다.
 */
export async function fetchExhibitionArtist(
	exhibitionId: string,
): Promise<ExhibitionArtistInfo | null> {
	try {
		const { data } = await supabase
			.from('exhibitions')
			.select('artist, image_url')
			.eq('id', Number(exhibitionId))
			.maybeSingle();
		const artist = data?.artist?.trim();
		if (!artist) return null;
		return { artist, imageUrl: data?.image_url ?? undefined };
	} catch {
		return null;
	}
}

/**
 * artist_intros 캐시 조회 — 실패해도(테이블 문제 등) 캐시 미스로 취급해 생성으로 넘어간다.
 * 선례: fetchArtworksForExhibition의 artist_artworks 캐시.
 */
export async function readArtistIntroCache(artist: string): Promise<string | null> {
	try {
		const { data } = await supabase
			.from('artist_intros')
			.select('intro')
			.eq('artist', artist)
			.maybeSingle();
		const intro = data?.intro?.trim();
		return intro ? intro : null;
	} catch {
		return null;
	}
}

// 캐시 저장은 응답을 기다리지 않는다(fire-and-forget) — 다음 관람자부터 빨라지면 되는 것이지,
// 이번 세션이 저장 완료를 기다릴 필요는 없다.
export function writeArtistIntroCache(artist: string, intro: string) {
	supabase
		.from('artist_intros')
		.upsert({ artist, intro, updated_at: new Date().toISOString() })
		.then(() => {});
}
