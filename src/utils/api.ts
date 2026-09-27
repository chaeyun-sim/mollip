import { getAccessTokenForApi } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function edgeFunctionUrl(name: string): string {
	return `${SUPABASE_URL}/functions/v1/${name}`;
}

// 네트워크가 끊기거나 서버가 무응답 상태로 멈추면 fetch가 영영 안 끝날 수 있다 —
// 연결/첫 응답까지 이 시간을 넘기면 포기하고 에러로 처리한다.
const CONNECT_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs = CONNECT_TIMEOUT_MS,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

/** 만료됐을 수 있는 세션을 갱신한 뒤 유저 JWT만 고른다. anon 키는 쓰지 않는다. */
async function resolveUserAccessToken(): Promise<string | null> {
	await supabase.auth.getUser();
	const { data } = await supabase.auth.getSession();
	let token = data.session?.access_token ?? null;
	if (!token) {
		const { data: refreshed } = await supabase.auth.refreshSession();
		token = refreshed.session?.access_token ?? null;
	}
	if (!token) token = getAccessTokenForApi();
	if (!token || token === SUPABASE_ANON_KEY) return null;
	return token;
}

async function authHeaders(options?: { requireUser?: boolean }): Promise<Record<string, string>> {
	const userToken = await resolveUserAccessToken();
	if (options?.requireUser && !userToken) {
		throw new Error('로그인이 필요해요');
	}
	const token = userToken ?? SUPABASE_ANON_KEY;
	return {
		Authorization: `Bearer ${token}`,
		apikey: SUPABASE_ANON_KEY,
		'Content-Type': 'application/json',
	};
}

// -- Anthropic ----------------------------------------------------------------

type AnthropicMessage = { role: 'user' | 'assistant'; content: string };

export async function* streamDescriptionFromImage(
	imageBase64: string,
	mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
	systemPrompt: string,
): AsyncGenerator<string> {
	const res = await fetchWithTimeout(edgeFunctionUrl('stream-description'), {
		method: 'POST',
		headers: await authHeaders({ requireUser: true }),
		body: JSON.stringify({ mode: 'image', imageBase64, mediaType, systemPrompt }),
	});
	if (!res.ok) throw new Error(`stream-description ${res.status}`);

	yield* readSSEStream(res);
}

export async function* streamDescription(prompt: string): AsyncGenerator<string> {
	const res = await fetchWithTimeout(edgeFunctionUrl('stream-description'), {
		method: 'POST',
		headers: await authHeaders({ requireUser: true }),
		body: JSON.stringify({ mode: 'manual', prompt }),
	});
	if (!res.ok) throw new Error(`stream-description ${res.status}`);

	yield* readSSEStream(res);
}

export async function* streamChat(
	systemPrompt: string,
	messages: AnthropicMessage[],
): AsyncGenerator<string> {
	const headers = await authHeaders({ requireUser: true });
	const res = await fetch(edgeFunctionUrl('stream-chat'), {
		method: 'POST',
		headers,
		body: JSON.stringify({ systemPrompt, messages }),
	});
	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`stream-chat ${res.status}${body ? `: ${body}` : ''}`);
	}

	yield* readSSEStream(res);
}

export async function* streamRoute(systemPrompt: string, prompt: string): AsyncGenerator<string> {
	const res = await fetch(edgeFunctionUrl('generate-route'), {
		method: 'POST',
		headers: await authHeaders(),
		body: JSON.stringify({ systemPrompt, prompt }),
	});
	if (!res.ok) throw new Error(`generate-route ${res.status}`);

	yield* readSSEStream(res);
}

// 작가 소개 인트로는 타이프라이터 표시가 필요 없고 결과를 캐시에 통째로 저장해야 하므로
// SSE가 아닌 단발 JSON 응답으로 받는다.
export async function generateArtistIntro(
	artist: string,
	exhibitionTitle?: string,
): Promise<string> {
	const res = await fetch(edgeFunctionUrl('generate-artist-intro'), {
		method: 'POST',
		headers: await authHeaders({ requireUser: true }),
		body: JSON.stringify({ artist, exhibitionTitle }),
	});
	if (!res.ok) throw new Error(`generate-artist-intro ${res.status}`);
	const data = await res.json();
	const intro = typeof data.intro === 'string' ? data.intro.trim() : '';
	if (!intro) throw new Error('generate-artist-intro empty');
	return intro;
}

// -- ElevenLabs ---------------------------------------------------------------

export async function fetchVoices() {
	const res = await fetch(edgeFunctionUrl('voices'), {
		method: 'GET',
		headers: await authHeaders(),
	});
	if (!res.ok) throw new Error(`voices ${res.status}`);
	const data = await res.json();
	return data.voices as {
		voice_id: string;
		name: string;
		preview_url: string;
		description?: string;
		labels?: Record<string, string>;
	}[];
}

export async function fetchTTSBlob(voiceId: string, text: string, speed = 1.0): Promise<string> {
	const res = await fetchWithTimeout(edgeFunctionUrl('tts'), {
		method: 'POST',
		headers: await authHeaders({ requireUser: true }),
		body: JSON.stringify({ voiceId, text, speed }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(`tts ${res.status}: ${JSON.stringify(err)}`);
	}
	const buffer = await res.arrayBuffer();
	const base64 = arrayBufferToBase64(buffer);
	return `data:audio/mpeg;base64,${base64}`;
}

// -- Account -------------------------------------------------------------------

export async function deleteAccount(): Promise<void> {
	const res = await fetch(edgeFunctionUrl('delete-account'), {
		method: 'POST',
		headers: await authHeaders({ requireUser: true }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(`delete-account ${res.status}: ${JSON.stringify(err)}`);
	}
}

// -- Helpers ------------------------------------------------------------------

// 스트림 연결은 됐는데 중간에 응답이 뚝 끊기는 경우(네트워크 끊김 등) — 마지막 청크를
// 받은 뒤 이 시간 동안 다음 청크가 안 오면 포기한다. 정상적으로 길게 스트리밍되는
// 해설은 청크가 계속 들어오는 한 끊기지 않는다(전체 요청 시간이 아닌 idle 시간 기준).
const STREAM_IDLE_TIMEOUT_MS = 20000;

function readWithIdleTimeout(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	timeoutMs: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reader.cancel().catch(() => {});
			reject(new Error('stream idle timeout'));
		}, timeoutMs);
		reader
			.read()
			.then((result) => {
				clearTimeout(timer);
				resolve(result);
			})
			.catch((err) => {
				clearTimeout(timer);
				reject(err);
			});
	});
}

async function* readSSEStream(res: Response): AsyncGenerator<string> {
	const reader = res.body!.getReader();
	const decoder = new TextDecoder();
	let buf = '';

	while (true) {
		const { done, value } = await readWithIdleTimeout(reader, STREAM_IDLE_TIMEOUT_MS);
		if (done) break;
		buf += decoder.decode(value, { stream: true });
		const lines = buf.split('\n');
		buf = lines.pop() ?? '';
		for (const line of lines) {
			if (!line.startsWith('data: ')) continue;
			const json = line.slice(6).trim();
			if (json === '[DONE]') return;
			try {
				const evt = JSON.parse(json);
				if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
					yield evt.delta.text as string;
				}
			} catch {
				/* skip malformed */
			}
		}
	}
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(binary);
}
