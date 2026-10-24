import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';

// AI 비용이 발생하는 함수(Anthropic/ElevenLabs 호출)는 로그인 유저만 호출할 수 있어야 한다.
// 클라이언트는 이미 LoginRequiredPressable로 비로그인 사용자를 진입 자체에서 막고 있으므로,
// 여기서는 그 전제를 서버에서도 강제한다(anon key만으로는 통과 못 하게).
export async function requireUser(req: Request): Promise<Response | null> {
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) {
		return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
	const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
	// anon 키도 게이트웨이 verify_jwt를 통과하므로, 유저 JWT가 아니면 여기서 거절한다.
	if (!jwt || jwt === anonKey) {
		return new Response(JSON.stringify({ error: 'Invalid session' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	// Deno에는 세션 스토리지가 없다. persistSession을 켜 두면 getUser()가
	// Authorization 헤더를 무시하고 "Invalid session"을 낸다.
	const callerClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
		auth: { persistSession: false, autoRefreshToken: false },
	});
	const { data: userData, error: userError } = await callerClient.auth.getUser(jwt);
	if (userError || !userData?.user) {
		return new Response(JSON.stringify({ error: 'Invalid session' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	return null;
}
