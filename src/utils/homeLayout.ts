/** 홈 하단 섹션의 폭 기반 반응형 치수 계산 */

/** n열 그리드의 열 너비. 좌우 여백·열 간격을 뺀 뒤 내림해 합이 화면을 넘지 않게 한다. */
export const getGridColumnWidth = (
	windowWidth: number,
	sidePadding: number,
	gap: number,
	columns = 2,
): number =>
	Math.max(0, Math.floor((windowWidth - sidePadding * 2 - gap * (columns - 1)) / columns));

/** 주 목록을 앞에 두고, 모자란 칸은 보조 목록에서 중복 없이 채워 최대 count개를 만든다 */
export const fillToCount = <T extends { id: string }>(
	primary: T[],
	extras: T[],
	count: number,
): T[] => {
	const seen = new Set<string>();
	const result: T[] = [];
	for (const item of [...primary, ...extras]) {
		if (result.length >= count) break;
		if (seen.has(item.id)) continue;
		seen.add(item.id);
		result.push(item);
	}
	return result;
};
