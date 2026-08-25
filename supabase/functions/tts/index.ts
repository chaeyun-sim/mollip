import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { voiceId, text, speed = 1.0 } = await req.json();

		if (!voiceId || !text) {
			return new Response(JSON.stringify({ error: 'voiceId and text are required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const elevenlabsKey = Deno.env.get('ELEVENLABS_KEY');
		if (!elevenlabsKey) {
			return new Response(JSON.stringify({ error: 'ELEVENLABS_KEY not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
			method: 'POST',
			headers: {
				'xi-api-key': elevenlabsKey,
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				text,
				model_id: 'eleven_turbo_v2_5',
				voice_settings: {
					stability: 0.55,
					similarity_boost: 0.8,
					style: 0.1,
					use_speaker_boost: true,
					speed,
				},
			}),
		});

		if (!res.ok) {
			const err = await res.text();
			return new Response(JSON.stringify({ error: `ElevenLabs ${res.status}: ${err}` }), {
				status: res.status,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response(res.body, {
			headers: {
				...corsHeaders,
				'Content-Type': 'audio/mpeg',
			},
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
