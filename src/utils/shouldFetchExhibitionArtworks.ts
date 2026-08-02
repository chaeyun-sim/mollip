import type { Exhibition } from '@/src/data/exhibitions';
import { splitArtistNames } from '@/src/utils/exhibitionSearch';

/** 대형·테마 전시(복수 작가, 장르전 등) — Wikidata 대표작 검색을 시도할 만한 경우 */
const MAJOR_SHOW_RE =
	/인상|포스트.?인상|르너상스|바로크|모더니|초현실|표현|미니멀|팝.?아트|명화|名画|마스터|걸작|컬렉션|collection|회고|기념|특별|特別|대표|거장|센추리|century|사조|운동|전승|from the|마스터피스/i;

/**
 * 「관련 추천 작품」은 대형·장르전처럼 Wikidata에 자료가 풍부한 전시에만 조회한다.
 * 단일 작가 소규모 개인전은 동명·오매칭이 잦아 기본적으로 제외한다.
 */
export function shouldFetchExhibitionArtworks(
	exhibition: Pick<Exhibition, 'title' | 'artist' | 'tags' | 'genre'>,
): boolean {
	const artist = exhibition.artist?.trim();
	if (!artist) return false;

	if (splitArtistNames(artist).length >= 2) return true;
	if (MAJOR_SHOW_RE.test(exhibition.title)) return true;
	if (exhibition.tags?.some((t) => MAJOR_SHOW_RE.test(t))) return true;

	return false;
}
