import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const elevenlabsKey = Deno.env.get('ELEVENLABS_KEY');
		if (!elevenlabsKey) {
			return new Response(JSON.stringify({ error: 'ELEVENLABS_KEY not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const res = await fetch('https://api.elevenlabs.io/v1/voices', {
			headers: { 'xi-api-key': elevenlabsKey },
		});

		if (!res.ok) {
			const err = await res.text();
			return new Response(JSON.stringify({ error: `ElevenLabs ${res.status}: ${err}` }), {
				status: res.status,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const data = await res.json();
		const all = (data.voices ?? []) as {
			voice_id: string;
			name: string;
			preview_url: string;
			labels?: Record<string, string>;
		}[];

		const voices = all.filter((v) => {
			const lang = (v.labels?.['language'] ?? '').toLowerCase();
			return lang.includes('korean') || lang === 'ko';
		});

		return new Response(JSON.stringify({ voices }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
