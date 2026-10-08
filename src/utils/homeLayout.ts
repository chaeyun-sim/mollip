/** 홈 하단 섹션의 폭 기반 반응형 치수 계산 */

/** n열 그리드의 열 너비. 좌우 여백·열 간격을 뺀 뒤 내림해 합이 화면을 넘지 않게 한다. */
export const getGridColumnWidth = (
	windowWidth: number,
	sidePadding: number,
	gap: number,
	columns = 2,
): number =>
	Math.max(0, Math.floor((windowWidth - sidePadding * 2 - gap * (columns - 1)) / columns));
