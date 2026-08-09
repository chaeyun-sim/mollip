import { supabase } from '@/src/utils/supabase';

export interface KakaoLocalItem {
	place_name: string;
	address_name: string;
	road_address_name: string;
	x: string; // longitude
	y: string; // latitude
	place_url: string;
	category_name: string;
}

// @MX:NOTE: Kakao Local Search API는 서버 사이드 Edge Function('kakao-local-search')을 통해 호출됨
// @MX:NOTE: API 키는 Supabase Dashboard > Edge Functions > kakao-local-search > Secrets > KAKAO_API_KEY에 설정
export async function searchKakaoKeyword(query: string, size = 8): Promise<KakaoLocalItem[]> {
	const q = query.trim();
	if (q.length < 1) return [];

	const { data, error } = await supabase.functions.invoke<{ documents: KakaoLocalItem[] }>(
		'kakao-local-search',
		{ body: { query: q, size } },
	);

	if (error) {
		throw new Error(`Kakao search failed: ${error.message}`);
	}

	return data?.documents ?? [];
}
