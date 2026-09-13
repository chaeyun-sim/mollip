export function stripHtml(html: string): string {
	return html
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
		.trim();
}

/** 공백·대소문자 차이를 무시하고 전시 제목을 비교하기 위한 키를 만든다 */
export function normalizeExhibitionTitle(title: string): string {
	return title.replace(/\s+/g, '').toLowerCase();
}
