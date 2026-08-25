// dateKey 기반 고정 바코드 막대 폭 (렌더마다 동일)
export function barcodeWidths(dateKey: string): number[] {
	const seed = dateKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
	return Array.from({ length: 28 }, (_, i) => ((seed + i * 7) % 3) + 1);
}
