import { corsHeaders } from '../_shared/cors.ts';

// 2026-07-31부로 네이버 개발자센터 검색 API 신규 발급이 막히고 NAVER API HUB(NCP)로 이관됨.
// 엔드포인트·인증 헤더가 기존 openapi.naver.com과 다르다 (NAVER API HUB 문서 기준).
const NAVER_LOCAL_SEARCH_URL = 'https://naverapihub.apigw.ntruss.com/search/v1/local';

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const clientId = Deno.env.get('NAVER_CLIENT_ID');
		const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET');
		if (!clientId || !clientSecret) {
			return new Response(
				JSON.stringify({
					items: [],
					error: 'NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not configured',
				}),
				{ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
			);
		}

		const { query, display = 6 } = await req.json();
		if (!query || typeof query !== 'string') {
			return new Response(JSON.stringify({ error: 'query is required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// NAVER API HUB 지역 검색은 좌표 기반 정렬 파라미터를 지원하지 않음 (문서 기준) — 거리순 정렬은 클라이언트에서 처리
		const params = new URLSearchParams({ query, display: String(display) });
		const res = await fetch(`${NAVER_LOCAL_SEARCH_URL}?${params.toString()}`, {
			headers: {
				'X-NCP-APIGW-API-KEY-ID': clientId,
				'X-NCP-APIGW-API-KEY': clientSecret,
			},
		});

		if (!res.ok) {
			const err = await res.text();
			return new Response(JSON.stringify({ items: [], error: `Naver API ${res.status}: ${err}` }), {
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const data = await res.json();
		return new Response(JSON.stringify({ items: data.items ?? [] }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
