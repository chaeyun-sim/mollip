import { corsHeaders } from '../_shared/cors.ts';

// ODsay Lab 멀티모달 길찾기(maasRP) 프록시.
// API 키는 Supabase Dashboard > Edge Functions > odsay-route > Secrets > ODSAY_API_KEY에 설정.
// 위치정보법 — 좌표와 회원 식별정보가 함께 서버에 오지 않도록 앱은 유저 JWT 없이 anon 키로만 호출한다.
// 그래서 requireUser를 쓰지 않으며, 대신 한국 영역 밖이거나 숫자가 아닌 좌표는 ODsay로 보내기 전에 거절한다.
const ODSAY_MAAS_URL = 'https://api.odsay.com/v1/api/maasRP';

const KOREA_BOUNDS = { minLat: 33, maxLat: 39, minLon: 124, maxLon: 132 };

function isKoreaCoord(coord: { latitude?: unknown; longitude?: unknown } | null | undefined) {
	const lat = Number(coord?.latitude);
	const lon = Number(coord?.longitude);
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lon) &&
		lat >= KOREA_BOUNDS.minLat &&
		lat <= KOREA_BOUNDS.maxLat &&
		lon >= KOREA_BOUNDS.minLon &&
		lon <= KOREA_BOUNDS.maxLon
	);
}

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
		if (
			!isKoreaCoord(start) ||
			!isKoreaCoord(end) ||
			(searchMethod !== '1' && searchMethod !== '2')
		) {
			return new Response(
				JSON.stringify({ error: 'start, end(국내 좌표), searchMethod(1|2) are required' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
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
