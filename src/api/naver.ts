import { supabase } from '@/src/utils/supabase';

export interface NaverLocalItem {
	title: string;
	link: string;
	category: string;
	description: string;
	telephone: string;
	address: string;
	roadAddress: string;
	mapx: string; // longitude × 10^7
	mapy: string; // latitude × 10^7
}

// @MX:NOTE: Naver 지역검색 API는 서버 사이드 Edge Function('naver-local-search')을 통해 호출됨
// @MX:NOTE: NAVER_CLIENT_ID / NAVER_CLIENT_SECRET은 Supabase Secrets에서 관리
// 사용자 좌표는 서버로 보내지 않는다 — 서버는 좌표를 쓰지 않으며, 거리 계산은 클라이언트에서 한다
export async function searchNaverLocal(query: string, display = 6): Promise<NaverLocalItem[]> {
	const { data, error } = await supabase.functions.invoke<{
		items: NaverLocalItem[];
		error?: string;
	}>('naver-local-search', {
		body: { query, display },
	});

	if (error) {
		throw new Error(`Naver search failed: ${error.message}`);
	}

	if (data?.error) {
		console.warn('[naver] API error:', data.error);
	}

	return data?.items ?? [];
}
