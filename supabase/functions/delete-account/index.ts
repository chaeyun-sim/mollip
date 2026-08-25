import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const authHeader = req.headers.get('Authorization');
		if (!authHeader) {
			return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

		// 요청자 신원은 anon 클라이언트 + 요청자의 토큰으로 확인한다.
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

		// 실제 삭제는 service role 클라이언트로만 수행한다.
		const admin = createClient(supabaseUrl, serviceRoleKey);
		const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);
		if (deleteError) {
			return new Response(JSON.stringify({ error: deleteError.message }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		);
	}
});
