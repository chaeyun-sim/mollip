import { corsHeaders } from '../_shared/cors.ts';

// 브라우저 UA를 확인하는 핫링크 방지(myartmuseum.co.kr 등)와, iOS ATS가 막는 평문 HTTP를
// 우회하기 위해 서버에서 대신 요청해 HTTPS로 스트리밍한다.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const BLOCKED_HOSTS = new Set(['localhost', '0.0.0.0', '127.0.0.1', '::1', '169.254.169.254']);

function isBlockedTarget(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname)) return true;
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const target = new URL(req.url).searchParams.get('url');
  if (!target) {
    return new Response(JSON.stringify({ error: 'url query param is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid url' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (isBlockedTarget(targetUrl)) {
    return new Response(JSON.stringify({ error: 'target not allowed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Referer: `${targetUrl.protocol}//${targetUrl.hostname}/`,
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(JSON.stringify({ error: `upstream ${upstream.status}` }), {
        status: upstream.status || 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'fetch failed' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
