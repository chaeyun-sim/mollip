export function stripHtml(html: string): string {
	return (
		html
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/p>/gi, '\n\n')
			.replace(/<[^>]+>/g, '')
			// 공공API 응답이 이중 인코딩된 경우 &amp;middot; 처럼 &amp;가 다른 엔티티를 감싸므로 먼저 풀어준다.
			// &amp;amp; 같은 이중 인코딩된 & 자체를 완전히 풀려면 두 번 반복 적용이 필요하다.
			.replace(/&amp;/g, '&')
			.replace(/&amp;/g, '&')
			.replace(/&nbsp;/g, ' ')
			.replace(/&middot;/g, '·')
			.replace(/&ndash;/g, '–')
			.replace(/&mdash;/g, '—')
			.replace(/&times;/g, '×')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/\n{3,}/g, '\n\n')
			.trim()
	);
}

const TITLE_PREFIX_RE =
	/^\s*(?:\[[^\]]*(?:온라인|특별|기획|상설|전시)[^\]]*\]|【[^】]*(?:온라인|특별|기획|상설|전시)[^】]*】|\([^)]*(?:온라인|특별|기획|상설|전시)[^)]*\)|<[^>]*(?:온라인|특별|기획|상설|전시)[^>]*>|(?:온라인\s*)?(?:특별|기획|상설)\s*전\s*[:：\-–—]?|온라인\s*전시\s*[:：\-–—]?)\s*/;

export function canonicalExhibitionTitle(title: string): string {
	let cleaned = stripHtml(title);
	let prev: string | null = null;
	while (prev !== cleaned) {
		prev = cleaned;
		cleaned = cleaned.replace(TITLE_PREFIX_RE, '').trim();
	}
	return cleaned.replace(/^[\s\-–—:：]+|[\s\-–—:：]+$/g, '');
}

/** 홍보 접두사·공백·기호·대소문자 차이를 무시하고 전시 제목을 비교하기 위한 키를 만든다 */
export function normalizeExhibitionTitle(title: string): string {
	return canonicalExhibitionTitle(title)
		.toLowerCase()
		.replace(/[^0-9a-z가-힣]+/g, '');
}
