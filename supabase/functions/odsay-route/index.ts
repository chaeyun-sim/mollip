import { corsHeaders } from '../_shared/cors.ts';

// ODsay Lab 멀티모달 길찾기(maasRP) 프록시.
// API 키는 Supabase Dashboard > Edge Functions > odsay-route > Secrets > ODSAY_API_KEY에 설정.
const ODSAY_MAAS_URL = 'https://api.odsay.com/v1/api/maasRP';

function formatSearchTime(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const apiKey = Deno.env.get('ODSAY_API_KEY');
		if (!apiKey) {
			return new Response(JSON.stringify({ error: 'ODSAY_API_KEY not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const { start, end, searchMethod } = await req.json();
		if (!start || !end || (searchMethod !== '1' && searchMethod !== '2')) {
			return new Response(
				JSON.stringify({ error: 'start, end, searchMethod(1|2) are required' }),
				{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
			);
		}

		const params = new URLSearchParams({
			apiKey,
			lang: '0',
			SX: String(start.longitude),
			SY: String(start.latitude),
			EX: String(end.longitude),
			EY: String(end.latitude),
			SearchTime: formatSearchTime(new Date()),
			SearchMethod: searchMethod,
		});

		const res = await fetch(`${ODSAY_MAAS_URL}?${params.toString()}`);
		if (!res.ok) {
			const err = await res.text();
			return new Response(JSON.stringify({ error: `ODsay API ${res.status}: ${err}` }), {
				status: res.status,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const json = await res.json();
		if (json.error) {
			return new Response(JSON.stringify({ paths: [] }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ paths: json.result?.paths ?? [] }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
