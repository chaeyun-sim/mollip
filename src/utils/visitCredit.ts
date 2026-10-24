import { cleanText } from '@/src/utils/museumWall';

/**
 * 상세 화면의 "작가 / 장소" 한 줄. 비었거나 "-"뿐인 값은 없는 것으로 보고,
 * 한쪽만 있으면 슬래시 없이 그 값만, 둘 다 없으면 undefined(행을 숨긴다).
 * 작가는 전시 상세의 값만 받는다 — 작품 작가로 대신 채우지 않는다.
 */
export const buildCreditLine = (artist?: string, venue?: string): string | undefined => {
	const parts = [cleanText(artist), cleanText(venue)].filter((part): part is string =>
		Boolean(part),
	);
	const unique = parts.filter((part, index) => parts.indexOf(part) === index);
	return unique.length > 0 ? unique.join(' / ') : undefined;
};
