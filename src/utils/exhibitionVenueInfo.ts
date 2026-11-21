/** "본문 (대안: A, B)" 형태의 주차 안내 문자열을 요약과 대안 목록으로 분리한다. */
export function parseParkingAlternatives(parking: string | undefined): {
	summary: string;
	alternatives: string[];
} {
	if (!parking) return { summary: '', alternatives: [] };
	const marker = '대안:';
	const markerIndex = parking.indexOf(marker);
	if (markerIndex === -1) {
		return { summary: parking.trim(), alternatives: [] };
	}
	// "본문 (대안: A, B)" 형태 — 여는 괄호까지 잘라내 요약에 "(" 가 남지 않게, 닫는 괄호도 마지막 항목에서 제거
	const summary = parking.slice(0, markerIndex).trim().replace(/\($/, '').trim();
	const alternatives = parking
		.slice(markerIndex + marker.length)
		.replace(/\)\s*$/, '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
	return { summary, alternatives };
}
