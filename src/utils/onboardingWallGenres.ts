import { ART_GENRE_VALUES } from '@/src/constants/exhibitionTaxonomy';

/** 선택된 장르 목록에서 ART_GENRE_VALUES와 일치하는 중복 없는 값만 남긴다 (AC-4). */
export function toValidGenres(genres: string[]): string[] {
	const unique = [...new Set(genres)];
	return unique.filter((genre) => ART_GENRE_VALUES.has(genre));
}

/** Only onboarding preferences are grouped; exhibition taxonomy remains unchanged. */
export function normalizeOnboardingGenres(genres: string[]): string[] {
 const mapping: Record<string, string> = {
  사진: '사진', 조각: '조각', 판화: '판화', 한국화: '한국화', 회화: '회화', 공예: '공예',
  현대미술: '현대미술', 설치: '현대미술', 미디어아트: '현대미술', 영상: '현대미술', 사운드: '현대미술', 팝아트: '현대미술',
  드로잉: '회화', 섬유: '공예', 그래픽: '판화',
 };
 return toValidGenres(genres.flatMap((genre) => mapping[genre] ? [mapping[genre]] : []));
}
