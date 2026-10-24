// 빈티지 아날로그 티켓 팔레트 — 낡은 종이·필름 느낌의 웜톤 파스텔
const TICKET_COLORS = [
	'#F5E6C8', // 페이디드 크림 (Faded Cream)
	'#EED5B0', // 웜 버터스코치 (Warm Butterscotch)
	'#E4CECC', // 더스티 로즈 (Dusty Rose)
	'#C8D4C4', // 세이지 그린 (Sage Green)
	'#C4CEDC', // 스틸 블루 (Steel Blue)
	'#D8CCDC', // 라벤더 미스트 (Lavender Mist)
	'#EAD4B8', // 피치 크림 (Peach Cream)
	'#C4D4D0', // 민트 크림 (Mint Cream)
	'#DAD4CC', // 리넨 (Linen)
	'#E8CCCC', // 블러시 (Blush)
	'#C8CED8', // 미스티 블루 (Misty Blue)
	'#D0C8B8', // 타우프 (Taupe)
];

function djb2(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash);
}

export function stringToTicketColor(str: string): string {
	return TICKET_COLORS[djb2(str) % TICKET_COLORS.length];
}

/** 티켓 색상 기반으로 약간 어두운 텍스트/테두리 색상 반환 */
export function ticketTextColor(bg: string): string {
	// 모든 팔레트 색상이 크림/웜톤이므로 공통으로 세피아 다크 사용
	return '#4A3728';
}
