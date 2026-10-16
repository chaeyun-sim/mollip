import { stripHtml } from '@/src/utils/stripHtml';
import { supabase } from '@/src/utils/supabase';

/** 모델이 작가 정보를 확신할 수 없을 때 해설 대신 돌려주는 표식 — 서버 프롬프트와 같은 값이어야 한다 */
export const NO_ARTIST_INFO_MARKER = '[NO_INFO]';

// 모델이 해설 대신 사과·메모를 쓴 경우에 자주 나오는 문구 — 낭독·표시하면 안 된다
const META_PHRASES = ['작성자 비고', '낭독하지 않', '죄송합니다', NO_ARTIST_INFO_MARKER];

/** 관람객에게 그대로 보여주고 읽어줘도 되는 작가 소개인지 — 거절문·메모·표식이면 false */
export const isUsableArtistIntro = (text: string | null | undefined): text is string => {
	const trimmed = text?.trim();
	if (!trimmed) return false;
	return !META_PHRASES.some((phrase) => trimmed.includes(phrase));
};

export interface ExhibitionArtistInfo {
	artist: string;
	imageUrl?: string;
	/** 작가 특정·검색에 쓸 전시 정보(전시명·장소·기간·설명) — 작가명이 한글 음차뿐일 때 인물을 가려내는 단서 */
	context?: string;
}

const MAX_DESCRIPTION_LENGTH = 600;

interface ExhibitionContextRow {
	title?: string | null;
	venue_name_fallback?: string | null;
	event_site?: string | null;
	start_date?: string | null;
	end_date?: string | null;
	description?: string | null;
}

/** 작가 소개 생성에 넘길 전시 정보를 줄 단위 텍스트로 만든다 — 비어 있는 항목은 뺀다 */
export const buildExhibitionContext = (row: ExhibitionContextRow): string | undefined => {
	const venue = [row.venue_name_fallback, row.event_site].filter(Boolean).join(' ').trim();
	const period = [row.start_date, row.end_date].filter(Boolean).join(' ~ ');
	const description = stripHtml(row.description ?? '')
		.trim()
		.slice(0, MAX_DESCRIPTION_LENGTH);

	const lines = [
		row.title?.trim() && `전시명: ${row.title.trim()}`,
		venue && `장소: ${venue}`,
		period && `기간: ${period}`,
		description && `설명: ${description}`,
	].filter(Boolean);
	return lines.length > 0 ? lines.join('\n') : undefined;
};

/**
 * 몰입 대상 전시의 작가명·대표 이미지를 조회한다.
 * id가 있으면 id로 정확 조회하고, id가 없으면 제목으로 한 번 더 찾는다.
 * artist가 비어 있는 전시(단체전)나 조회 실패는 모두 null로 취급해 기능을 스킵한다.
 */
export async function fetchExhibitionArtist(
	exhibitionId: string | null,
	exhibitionTitle?: string,
): Promise<ExhibitionArtistInfo | null> {
	try {
		let query = supabase
			.from('exhibitions')
			.select(
				'artist, image_url, title, venue_name_fallback, event_site, start_date, end_date, description',
			);
		if (exhibitionId) {
			query = query.eq('id', Number(exhibitionId));
		} else {
			const title = exhibitionTitle?.trim();
			if (!title) return null;
			query = query.eq('title', title);
		}

		const { data } = await query.limit(1).maybeSingle();
		const artist = data?.artist?.trim();
		if (!artist) return null;
		return {
			artist,
			imageUrl: data?.image_url ?? undefined,
			context: data ? buildExhibitionContext(data) : undefined,
		};
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
		// 예전에 저장된 거절문·메모가 캐시에 남아 있어도 쓰지 않고 다시 생성으로 넘어간다
		return isUsableArtistIntro(intro) ? intro : null;
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
