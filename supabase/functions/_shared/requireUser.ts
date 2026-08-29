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

	const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
	const callerClient = createClient(supabaseUrl, anonKey, {
		global: { headers: { Authorization: authHeader } },
	});
	const { data: userData, error: userError } = await callerClient.auth.getUser();
	if (userError || !userData?.user) {
		return new Response(JSON.stringify({ error: 'Invalid session' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	return null;
}
