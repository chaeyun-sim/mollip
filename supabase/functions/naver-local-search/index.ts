import { corsHeaders } from '../_shared/cors.ts';

const NAVER_LOCAL_SEARCH_URL = 'https://openapi.naver.com/v1/search/local.json';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('NAVER_CLIENT_ID');
    const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ items: [], error: 'NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { query, display = 6, latitude, longitude } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const params = new URLSearchParams({ query, display: String(display) });
    // 좌표가 있으면 거리순 정렬 활성화 (lon,lat 순서)
    if (typeof longitude === 'number' && typeof latitude === 'number') {
      params.set('coordinate', `${longitude},${latitude}`);
    }
    const res = await fetch(`${NAVER_LOCAL_SEARCH_URL}?${params.toString()}`, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(
        JSON.stringify({ items: [], error: `Naver API ${res.status}: ${err}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ items: data.items ?? [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
