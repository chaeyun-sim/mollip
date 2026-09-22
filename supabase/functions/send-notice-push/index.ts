/**
 * send-notice-push
 * Supabase Database Webhook 트리거 — notices 테이블 INSERT 시 호출.
 * (대시보드에서 Database > Webhooks로 등록: table=notices, event=Insert,
 *  type=Supabase Edge Functions, function=send-notice-push,
 *  Authorization 헤더에 SERVICE_ROLE_KEY 입력)
 *
 * category별로 유저 notification_prefs를 확인해서 발송 + 로그 기록.
 * category='general'인 공지는 선호 체크 없이 push_token 있는 모두에게 발송.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendAndLog, type NotificationRecord } from '../_shared/pushNotify.ts';

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

interface ProfileRow {
	id: string;
	push_token: string;
	notification_prefs: { version_update?: boolean; terms_update?: boolean };
}

const PREF_KEY_BY_CATEGORY: Record<
	NoticeRecord['category'],
	'version_update' | 'terms_update' | null
> = {
	version_update: 'version_update',
	terms_update: 'terms_update',
	general: null,
};

function buildRecords(notice: NoticeRecord, profiles: ProfileRow[]): NotificationRecord[] {
	const prefKey = PREF_KEY_BY_CATEGORY[notice.category];

	return profiles.flatMap((profile) => {
		if (prefKey && profile.notification_prefs?.[prefKey] === false) return [];

		const token = profile.push_token;
		if (!token || !token.startsWith('ExponentPushToken')) return [];

		return [
			{
				userId: profile.id,
				token,
				type: `notice_${notice.category}`,
				title: '',
				body: notice.title,
				data: { type: 'notice', noticeId: notice.id, category: notice.category },
			},
		];
	});
}

Deno.serve(async (req) => {
	const authHeader = req.headers.get('Authorization') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	if (!authHeader.includes(serviceKey)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const payload = (await req.json()) as WebhookPayload;
	if (payload.table !== 'notices' || payload.type !== 'INSERT') {
		return new Response(JSON.stringify({ sent: 0, reason: 'not a notices insert' }));
	}

	const notice = payload.record;

	const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
	const supabase = createClient(supabaseUrl, serviceKey);

	const { data: profiles, error: profileErr } = await supabase
		.from('profiles')
		.select('id, push_token, notification_prefs')
		.not('push_token', 'is', null);

	if (profileErr || !profiles?.length) {
		return new Response(
			JSON.stringify({ sent: 0, reason: profileErr?.message ?? 'no push tokens' }),
		);
	}

	const records = buildRecords(notice, profiles as ProfileRow[]);
	const sent = await sendAndLog(supabase, records);

	return new Response(JSON.stringify({ sent }), {
		headers: { 'Content-Type': 'application/json' },
	});
});
