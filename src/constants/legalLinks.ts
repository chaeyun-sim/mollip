/** 서비스 이용약관·개인정보 처리방침 웹페이지 — 본문 정본은 Notion이며, 바뀌면 이 두 줄만 고친다 */
export const LEGAL_LINKS = {
	terms: 'https://chaeyun-sim.notion.site/3e8c9e21e50680509ae7df689f2a20b7',
	privacy: 'https://chaeyun-sim.notion.site/3b6c9e21e50680e5af0ee2beb08b1303',
} as const;

export type LegalDocument = keyof typeof LEGAL_LINKS;
