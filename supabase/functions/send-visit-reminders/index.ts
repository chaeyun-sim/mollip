/**
 * send-visit-reminders
 * 매일 오전 10시(KST) 실행 — pg_cron 스케줄: '0 1 * * *' (UTC)
 *
 * 1. 어제 관람 확정(visits) 기록 중 memo가 없는 건 조회
 * 2. 해당 유저의 push_token으로 리뷰 작성 유도 알림 전송 + 로그 기록
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendAndLog, type NotificationRecord } from '../_shared/pushNotify.ts';

interface VisitRow {
	user_id: string;
	date: string;
}

interface ProfileRow {
	id: string;
	push_token: string;
	notification_prefs: { visit_review?: boolean };
}

function buildRecords(visits: VisitRow[], profiles: ProfileRow[]): NotificationRecord[] {
	const profileByUserId = new Map(profiles.map((p) => [p.id, p]));

	const seenUserIds = new Set<string>();
	return visits.flatMap((visit) => {
		if (seenUserIds.has(visit.user_id)) return [];
		seenUserIds.add(visit.user_id);
		const profile = profileByUserId.get(visit.user_id);
		if (!profile || profile.notification_prefs?.visit_review === false) return [];

		const token = profile.push_token;
		if (!token || !token.startsWith('ExponentPushToken')) return [];

		return [
			{
				userId: visit.user_id,
				token,
				type: 'visit_review',
				title: '',
				body: '오늘 전시는 즐거우셨나요? 다이어리에서 기록해보세요!',
				data: { type: 'visit_review', date: visit.date },
			},
		];
	});
}

Deno.serve(async (req) => {
	// cron 호출 또는 service_role 수동 트리거만 허용
	const authHeader = req.headers.get('Authorization') ?? '';
	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	if (!authHeader.includes(serviceKey)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
	const supabase = createClient(supabaseUrl, serviceKey);

	const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

	// 어제 관람 확정 기록 중 메모(리뷰) 없는 것
	const { data: visits, error: visitErr } = await supabase
		.from('visits')
		.select('user_id, date')
		.eq('date', yesterday)
		.is('memo', null);

	if (visitErr || !visits?.length) {
		return new Response(JSON.stringify({ sent: 0, reason: visitErr?.message ?? 'no visits' }));
	}

	// 해당 유저들의 push_token
	const userIds = [...new Set(visits.map((v) => v.user_id))];
	const { data: profiles, error: profileErr } = await supabase
		.from('profiles')
		.select('id, push_token, notification_prefs')
		.in('id', userIds)
		.not('push_token', 'is', null);

	if (profileErr || !profiles?.length) {
		return new Response(
			JSON.stringify({ sent: 0, reason: profileErr?.message ?? 'no push tokens' }),
		);
	}

	const records = buildRecords(visits as VisitRow[], profiles as ProfileRow[]);
	const sent = await sendAndLog(supabase, records);

	return new Response(JSON.stringify({ sent }), {
		headers: { 'Content-Type': 'application/json' },
	});
});
