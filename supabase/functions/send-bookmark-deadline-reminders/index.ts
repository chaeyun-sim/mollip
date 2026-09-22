/**
 * send-bookmark-deadline-reminders
 * 매일 오전 10시(KST) 실행 — pg_cron 스케줄: '0 1 * * *' (UTC)
 *
 * 1. 내일 마감(end_date)인 전시 조회
 * 2. 그 전시를 찜(bookmark_exhibitions)한 유저 중 알림 켠 유저에게 전송 + 로그 기록
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendAndLog, type NotificationRecord } from '../_shared/pushNotify.ts';

interface ExhibitionRow {
	id: string | number;
	title: string;
}

interface BookmarkRow {
	user_id: string;
	exhibition_id: string;
}

interface ProfileRow {
	id: string;
	push_token: string;
	notification_prefs: { bookmark_deadline?: boolean };
}

function buildRecords(
	bookmarks: BookmarkRow[],
	exhibitionById: Map<string, ExhibitionRow>,
	profiles: ProfileRow[],
): NotificationRecord[] {
	const profileById = new Map(profiles.map((p) => [p.id, p]));

	return bookmarks.flatMap((bm) => {
		const profile = profileById.get(bm.user_id);
		if (!profile) return [];
		if (profile.notification_prefs?.bookmark_deadline === false) return [];

		const token = profile.push_token;
		if (!token || !token.startsWith('ExponentPushToken')) return [];

		const exhibition = exhibitionById.get(String(bm.exhibition_id));
		if (!exhibition) return [];

		return [
			{
				userId: bm.user_id,
				token,
				type: 'bookmark_deadline',
				title: '',
				body: `찜한 전시 「${exhibition.title}」가 곧 마감돼요! 😭`,
				data: { type: 'bookmark_deadline', exhibitionId: String(exhibition.id) },
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

	const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
	const supabase = createClient(supabaseUrl, serviceKey);

	const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

	// 내일 마감인 전시
	const { data: exhibitions, error: exErr } = await supabase
		.from('exhibitions')
		.select('id, title')
		.eq('end_date', tomorrow);

	if (exErr || !exhibitions?.length) {
		return new Response(JSON.stringify({ sent: 0, reason: exErr?.message ?? 'no exhibitions' }));
	}

	const exhibitionIds = exhibitions.map((e) => String(e.id));
	const exhibitionById = new Map(exhibitions.map((e) => [String(e.id), e as ExhibitionRow]));

	// 그 전시를 찜한 유저
	const { data: bookmarks, error: bmErr } = await supabase
		.from('bookmark_exhibitions')
		.select('user_id, exhibition_id')
		.in('exhibition_id', exhibitionIds);

	if (bmErr || !bookmarks?.length) {
		return new Response(JSON.stringify({ sent: 0, reason: bmErr?.message ?? 'no bookmarks' }));
	}

	const userIds = [...new Set(bookmarks.map((b) => b.user_id))];
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

	const records = buildRecords(
		bookmarks as BookmarkRow[],
		exhibitionById,
		profiles as ProfileRow[],
	);
	const sent = await sendAndLog(supabase, records);

	return new Response(JSON.stringify({ sent }), {
		headers: { 'Content-Type': 'application/json' },
	});
});
