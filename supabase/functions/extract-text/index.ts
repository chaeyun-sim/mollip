import { corsHeaders } from '../_shared/cors.ts';
import { requireUser } from '../_shared/requireUser.ts';

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	const authError = await requireUser(req);
	if (authError) return authError;

	try {
		const { imageBase64, mediaType } = await req.json();

		if (!imageBase64 || !mediaType) {
			return new Response(JSON.stringify({ error: 'imageBase64 and mediaType are required' }), {
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

		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': anthropicKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				model: 'claude-opus-4-6',
				max_tokens: 1024,
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'image',
								source: { type: 'base64', media_type: mediaType, data: imageBase64 },
							},
							{
								type: 'text',
								text: '이 이미지에 있는 텍스트를 모두 추출해서 그대로 출력해줘. 텍스트만 출력하고 다른 설명은 하지 마.',
							},
						],
					},
				],
			}),
		});

		if (!res.ok) {
			const err = await res.text();
			return new Response(JSON.stringify({ error: `Anthropic ${res.status}: ${err}` }), {
				status: res.status,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const data = await res.json();
		const text = data.content?.[0]?.text ?? '';

		return new Response(JSON.stringify({ text }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
