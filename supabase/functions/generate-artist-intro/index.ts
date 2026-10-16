import { corsHeaders } from '../_shared/cors.ts';
import { requireUser } from '../_shared/requireUser.ts';

// 작가 소개 인트로는 타이프라이터 표시가 필요 없고(캐시 후 즉시 표시가 목표) 결과를 그대로
// 캐시 테이블에 넣어야 하므로, stream-description과 달리 non-streaming 단발 응답으로 받는다.
const SYSTEM_PROMPT = `당신은 미술관 오디오 가이드를 집필하는 전문 해설가입니다. 전시장에 막 들어선 관람객에게 들려줄 "작가 소개" 인트로 해설을 작성하세요.

[작가 확인]
- 작가명은 한글 음차라서 공식 표기와 다를 수 있습니다(예: 외국 작가의 원어 철자). 전시 정보(전시명·장소·기간·설명)와 웹 검색 결과를 함께 보고 같은 인물인지 확인하세요.
- 웹 검색 도구로 생몰년·이력·주요 전시를 확인한 뒤 작성하세요. 검색 결과로 확인된 사실만 쓰세요.
- 검색하는 과정이나 확인 결과에 대한 설명은 출력하지 말고, 최종 해설 본문만 출력하세요.

[절대 규칙]
- 이 작가에 대해 신뢰할 수 있는 정보를 충분히 알지 못하면 해설을 쓰지 말고, 정확히 [NO_INFO] 한 단어만 출력하세요. 사과·설명·작성자 메모·추가 요청 등 다른 문장은 절대 쓰지 마세요. 출력은 관람객에게 그대로 낭독됩니다.
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

const MAX_CONTEXT_LENGTH = 1500;
const MAX_SEARCHES = 3;
/** 검색이 길어져 pause_turn으로 멈췄을 때 이어서 요청하는 최대 횟수 */
const MAX_TURNS = 3;

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	const authError = await requireUser(req);
	if (authError) return authError;

	try {
		const { artist, exhibitionTitle, exhibitionContext } = await req.json();

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
		const context =
			typeof exhibitionContext === 'string'
				? exhibitionContext.trim().slice(0, MAX_CONTEXT_LENGTH)
				: '';
		const userPrompt = [
			SYSTEM_PROMPT,
			`작가: ${artist.trim()}`,
			title && `전시: ${title}`,
			context && `전시 정보:\n${context}`,
		]
			.filter(Boolean)
			.join('\n\n');

		// 웹 검색을 쓰면 모델이 검색 전에 중간 문장을 내보내고, 긴 검색은 pause_turn으로 멈출 수 있어
		// 마지막 도구 블록 뒤의 텍스트만 최종 해설로 쓰고, 멈추면 이어서 요청한다.
		const messages: { role: string; content: unknown }[] = [{ role: 'user', content: userPrompt }];
		let intro = '';

		for (let turn = 0; turn < MAX_TURNS; turn += 1) {
			const res = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'x-api-key': anthropicKey,
					'anthropic-version': '2023-06-01',
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					model: 'claude-opus-4-6',
					max_tokens: 2048,
					tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }],
					messages,
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
			const blocks: { type: string; text?: string }[] = data.content ?? [];

			if (data.stop_reason === 'pause_turn') {
				messages.push({ role: 'assistant', content: blocks });
				continue;
			}

			const lastToolIndex = blocks.map((block) => block.type !== 'text').lastIndexOf(true);
			intro = blocks
				.slice(lastToolIndex + 1)
				.filter((block) => block.type === 'text')
				.map((block) => block.text ?? '')
				.join('')
				.trim();
			break;
		}

		// 모델이 작가 정보를 모른다고 표시한 경우 — 해설 없음(null)으로 돌려 클라이언트가 건너뛰게 한다
		if (intro.includes('[NO_INFO]')) {
			return new Response(JSON.stringify({ intro: null }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

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
