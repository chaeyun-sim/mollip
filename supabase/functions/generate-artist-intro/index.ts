import { corsHeaders } from '../_shared/cors.ts';

// 작가 소개 인트로는 타이프라이터 표시가 필요 없고(캐시 후 즉시 표시가 목표) 결과를 그대로
// 캐시 테이블에 넣어야 하므로, stream-description과 달리 non-streaming 단발 응답으로 받는다.
const SYSTEM_PROMPT = `당신은 미술관 오디오 가이드를 집필하는 전문 해설가입니다. 전시장에 막 들어선 관람객에게 들려줄 "작가 소개" 인트로 해설을 작성하세요.

[절대 규칙]
- 확실하지 않은 날짜, 인명, 장소, 수치는 절대 지어내지 마세요.
- 불확실한 정보는 "알려진 바로는", "기록에 따르면" 등으로 구분하세요.
- 특정 작품의 조형적 특징을 실제로 보지 않고 추측해 서술하지 마세요.

[분량 기준 — 반드시 준수]
낭독 40~55초 분량 (한국어 약 220~280자). 개별 작품 해설과 비슷한 길이로 맞추세요.
분량을 채우기 위해 늘이지 말고 핵심만 간결하게 담으세요.

[포함할 내용]
- 작가의 생애 (생몰년·핵심 이력·활동 시기)
- 철학적·미학적 태도와 화풍
- 이 전시를 어떤 시선으로 감상하면 좋은지에 대한 안내 (마지막 1~2문장)

항목 번호나 마크다운 없이, 낭독하기 좋은 자연스러운 문장으로 작성하세요.`;

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { artist, exhibitionTitle } = await req.json();

		if (!artist || typeof artist !== 'string' || !artist.trim()) {
			return new Response(JSON.stringify({ error: 'artist is required' }), {
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

		const title = typeof exhibitionTitle === 'string' ? exhibitionTitle.trim() : '';
		const userPrompt = `${SYSTEM_PROMPT}\n\n작가: ${artist.trim()}${title ? `\n전시: ${title}` : ''}`;

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
				messages: [{ role: 'user', content: userPrompt }],
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
		const intro = (data.content ?? [])
			.filter((block: { type: string }) => block.type === 'text')
			.map((block: { text: string }) => block.text)
			.join('')
			.trim();

		if (!intro) {
			return new Response(JSON.stringify({ error: 'empty completion' }), {
				status: 502,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ intro }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
