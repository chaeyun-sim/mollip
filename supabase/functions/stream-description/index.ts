import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { mode, imageBase64, mediaType, prompt, systemPrompt } = await req.json();

		if (!mode || (mode !== 'image' && mode !== 'manual')) {
			return new Response(JSON.stringify({ error: 'mode must be "image" or "manual"' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const anthropicKey = Deno.env.get('ANTHROPIC_KEY');
		if (!anthropicKey) {
			return new Response(JSON.stringify({ error: 'ANTHROPIC_KEY not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		let body: Record<string, unknown>;
		const headers: Record<string, string> = {
			'x-api-key': anthropicKey,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json',
		};

		if (mode === 'image') {
			if (!imageBase64 || !mediaType || !systemPrompt) {
				return new Response(
					JSON.stringify({ error: 'image mode requires imageBase64, mediaType, and systemPrompt' }),
					{ status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
				);
			}
			body = {
				model: 'claude-opus-4-6',
				max_tokens: 1024,
				stream: true,
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'image',
								source: { type: 'base64', media_type: mediaType, data: imageBase64 },
							},
							{ type: 'text', text: systemPrompt },
						],
					},
				],
			};
		} else {
			if (!prompt) {
				return new Response(JSON.stringify({ error: 'manual mode requires prompt' }), {
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				});
			}
			body = {
				model: 'claude-opus-4-6',
				max_tokens: 1024,
				stream: true,
				messages: [{ role: 'user', content: prompt }],
			};
		}

		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const err = await res.text();
			return new Response(JSON.stringify({ error: `Anthropic ${res.status}: ${err}` }), {
				status: res.status,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response(res.body, {
			headers: {
				...corsHeaders,
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
