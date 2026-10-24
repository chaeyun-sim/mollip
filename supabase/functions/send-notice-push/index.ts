/**
 * send-notice-push
 * Supabase Database Webhook 트리거 — notices 테이블 INSERT 시 호출.
 * (대시보드에서 Database > Webhooks로 등록: table=notices, event=Insert,
 *  type=Supabase Edge Functions, function=send-notice-push,
 *  Authorization 헤더에 SERVICE_ROLE_KEY 입력)
 *
 * 직접 발송하지 않고 notification_jobs 큐에 1분 뒤 작업으로 넣는다.
 * 실제 발송은 process-notification-jobs가 처리한다.
 * DB 트리거(enqueue_notice_notification)와 dedupe_key가 같아 중복 작업은 생기지 않는다.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

interface NoticeRecord {
	id: string;
	title: string;
	body: string;
	category: 'version_update' | 'terms_update' | 'general';
}

interface WebhookPayload {
	type: string;
	table: string;
	record: NoticeRecord;
}

Deno.serve(async (req) => {
	const authHeader = req.headers.get('Authorization') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	if (!serviceKey || !authHeader.includes(serviceKey)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const payload = (await req.json()) as WebhookPayload;
	if (payload.table !== 'notices' || payload.type !== 'INSERT') {
		return new Response(JSON.stringify({ sent: 0, reason: 'not a notices insert' }));
	}

	const notice = payload.record;

	const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
	const { error } = await supabase.from('notification_jobs').upsert(
		{
			kind: 'notice',
			dedupe_key: `notice:${notice.id}`,
			payload: notice,
			send_at: new Date(Date.now() + 60 * 1000).toISOString(),
		},
		{ onConflict: 'dedupe_key', ignoreDuplicates: true },
	);
	if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

	return new Response(JSON.stringify({ queued: true, delaySeconds: 60 }), {
		headers: { 'Content-Type': 'application/json' },
	});
});
