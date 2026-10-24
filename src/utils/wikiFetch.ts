import { proxiedImageUrl } from '@/src/utils/imageProxy';

const WIKI_HEADERS = {
	Accept: 'application/json',
	'User-Agent': 'Mollip/1.0 (art audio guide; https://mollip.app)',
};

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** 위키/위키데이터 JSON. 기기에서 403이면 image-proxy로 한 번 더 시도한다. */
export async function fetchWikiJson<T>(url: string): Promise<T> {
	try {
		const direct = await fetch(url, { headers: WIKI_HEADERS });
		if (direct.ok) return (await direct.json()) as T;
	} catch {
		// 기기에서 위키 호스트가 막히면 프록시로 이어간다
	}

	const proxied = proxiedImageUrl(url);
	if (!proxied || proxied === url) {
		throw new Error('wiki fetch failed');
	}

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (SUPABASE_ANON_KEY) {
		headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
		headers.apikey = SUPABASE_ANON_KEY;
	}

	const viaProxy = await fetch(proxied, { headers });
	if (!viaProxy.ok) throw new Error(`wiki-proxy ${viaProxy.status}`);
	return (await viaProxy.json()) as T;
}
