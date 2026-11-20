/** 인사 문구 등에 넣을 이름의 최대 글자 수 */
export const DISPLAY_NAME_MAX_LENGTH = 10;

const HANGUL_PATTERN = /[가-힣]/;

/**
 * 화면 문구용 이름 — 한글 이름은 그대로 두고(심 채윤 → 심 채윤),
 * 그 외 이름은 띄어쓰기가 있으면 첫 단어만 쓴다(John Doe → John).
 * 최대 글자 수를 넘으면 잘라서 말줄임표를 붙인다. 이모지가 반쪽으로 잘리지 않게 코드포인트 단위로 센다.
 */
export const toDisplayName = (
	name: string | null | undefined,
	maxLength = DISPLAY_NAME_MAX_LENGTH,
): string => {
	const trimmed = (name ?? '').trim();
	const base = HANGUL_PATTERN.test(trimmed) ? trimmed : (trimmed.split(/\s+/)[0] ?? '');
	const chars = Array.from(base);
	return chars.length > maxLength ? `${chars.slice(0, maxLength).join('')}…` : base;
};
