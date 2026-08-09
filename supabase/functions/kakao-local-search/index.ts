import { corsHeaders } from '../_shared/cors.ts';

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const apiKey = Deno.env.get('KAKAO_API_KEY');
		if (!apiKey) {
			return new Response(
				JSON.stringify({ error: 'KAKAO_API_KEY not configured' }),
				{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
			);
		}

		const { query, size = 8 } = await req.json();
		if (!query || typeof query !== 'string') {
			return new Response(
				JSON.stringify({ error: 'query is required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
			);
		}

		const params = new URLSearchParams({ query, size: String(size) });
		const res = await fetch(`${KAKAO_KEYWORD_URL}?${params.toString()}`, {
			headers: {
				Authorization: `KakaoAK ${apiKey}`,
			},
		});

		if (!res.ok) {
			const err = await res.text();
			return new Response(
				JSON.stringify({ error: `Kakao API ${res.status}: ${err}` }),
				{ status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
			);
		}

		const data = await res.json();
		return new Response(
			JSON.stringify({ documents: data.documents ?? [] }),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
