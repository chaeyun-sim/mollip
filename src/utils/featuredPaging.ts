/** 홈 대표 전시 캐러셀의 카드 폭과 스냅 간격을 화면 폭에서 계산한다 */
export const getFeaturedPageMetrics = (windowWidth: number, sidePadding: number, gap: number) => {
	const cardWidth = Math.max(0, windowWidth - sidePadding * 2);

	return { cardWidth, interval: cardWidth + gap };
};

/** 가로 스크롤 오프셋을 현재 페이지 인덱스(0..count-1)로 바꾼다 */
export const getFeaturedPageIndex = (offsetX: number, interval: number, count: number) => {
	if (interval <= 0 || count <= 0) return 0;

	return Math.min(count - 1, Math.max(0, Math.round(offsetX / interval)));
};
