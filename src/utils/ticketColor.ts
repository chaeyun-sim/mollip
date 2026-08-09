// @MX:NOTE: djb2 변형 해시(charCode + hash<<5 - hash)로 문자열 → HSL 파스텔 색상 결정
//   hue 0–359 (hash % 360), sat 28–46% (hash>>8), lit 80–90% (hash>>16)
//   동일 문자열 → 항상 동일 색상 / 시각적으로 구분 가능한 연한 파스텔 팔레트 유지
export function stringToTicketColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	const sat = 28 + (Math.abs(hash >> 8) % 18); // 28–46%
	const lit = 80 + (Math.abs(hash >> 16) % 10); // 80–90%
	return `hsl(${hue}, ${sat}%, ${lit}%)`;
}
