const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function edgeFunctionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

// -- Anthropic ----------------------------------------------------------------

type AnthropicMessage = { role: 'user' | 'assistant'; content: string };

export async function extractTextFromImage(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<string> {
  const res = await fetch(edgeFunctionUrl('extract-text'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ imageBase64, mediaType }),
  });
  if (!res.ok) throw new Error(`extract-text ${res.status}`);
  const data = await res.json();
  return data.text ?? '';
}

export async function* streamDescriptionFromImage(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  systemPrompt: string,
): AsyncGenerator<string> {
  const res = await fetch(edgeFunctionUrl('stream-description'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mode: 'image', imageBase64, mediaType, systemPrompt }),
  });
  if (!res.ok) throw new Error(`stream-description ${res.status}`);

  yield* readSSEStream(res);
}

export async function* streamDescription(
  prompt: string,
): AsyncGenerator<string> {
  const res = await fetch(edgeFunctionUrl('stream-description'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mode: 'manual', prompt }),
  });
  if (!res.ok) throw new Error(`stream-description ${res.status}`);

  yield* readSSEStream(res);
}

export async function* streamChat(
  systemPrompt: string,
  messages: AnthropicMessage[],
): AsyncGenerator<string> {
  const res = await fetch(edgeFunctionUrl('stream-chat'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ systemPrompt, messages }),
  });
  if (!res.ok) throw new Error(`stream-chat ${res.status}`);

  yield* readSSEStream(res);
}

// -- ElevenLabs ---------------------------------------------------------------

export async function fetchVoices() {
  const res = await fetch(edgeFunctionUrl('voices'), {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`voices ${res.status}`);
  const data = await res.json();
  return data.voices as { voice_id: string; name: string; preview_url: string; labels?: Record<string, string> }[];
}

export async function fetchTTSBlob(voiceId: string, text: string, speed = 1.0): Promise<string> {
  const res = await fetch(edgeFunctionUrl('tts'), {
    method: 'POST',
    headers: authHeaders(),
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

// -- Helpers ------------------------------------------------------------------

async function* readSSEStream(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
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
      } catch { /* skip malformed */ }
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
