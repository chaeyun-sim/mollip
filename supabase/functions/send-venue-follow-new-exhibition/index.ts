/**
 * send-venue-follow-new-exhibition
 * 매일 오전 10시(KST) 실행 — pg_cron 스케줄: '0 1 * * *' (UTC)
 *
 * 1. 오늘 시작(start_date)하는 전시 조회
 * 2. 그 전시관(museum_id)을 팔로우(venue_follows)한 유저 중 알림 켠 유저에게 전송 + 로그 기록
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendAndLog, type NotificationRecord } from '../_shared/pushNotify.ts';

interface ExhibitionRow {
	id: string | number;
	title: string;
	museum_id: number;
}

interface FollowRow {
	user_id: string;
	museum_id: number;
}

interface MuseumRow {
	id: number;
	name: string;
}

interface ProfileRow {
	id: string;
	push_token: string;
	notification_prefs: { venue_follow?: boolean };
}

function buildRecords(
	follows: FollowRow[],
	exhibitionsByMuseum: Map<number, ExhibitionRow[]>,
	museumById: Map<number, MuseumRow>,
	profiles: ProfileRow[],
): NotificationRecord[] {
	const profileById = new Map(profiles.map((p) => [p.id, p]));

	return follows.flatMap((follow) => {
		const profile = profileById.get(follow.user_id);
		if (!profile) return [];
		if (profile.notification_prefs?.venue_follow === false) return [];

		const token = profile.push_token;
		if (!token || !token.startsWith('ExponentPushToken')) return [];

		const exhibitions = exhibitionsByMuseum.get(follow.museum_id);
		if (!exhibitions?.length) return [];

		const museum = museumById.get(follow.museum_id);
		const museumName = museum?.name ?? '팔로우한 전시관';

		return [
			{
				userId: follow.user_id,
				token,
				type: 'venue_follow',
				title: '',
				body: `팔로우 하고 있는 ${museumName}에서 새 전시가 기획되었어요!`,
				data: { type: 'venue_follow', museumId: follow.museum_id },
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

	const today = new Date().toISOString().slice(0, 10);

	// 오늘 시작하는 전시
	const { data: exhibitions, error: exErr } = await supabase
		.from('exhibitions')
		.select('id, title, museum_id')
		.eq('start_date', today)
		.not('museum_id', 'is', null);

	if (exErr || !exhibitions?.length) {
		return new Response(
			JSON.stringify({ sent: 0, reason: exErr?.message ?? 'no new exhibitions' }),
		);
	}

	const exhibitionsByMuseum = new Map<number, ExhibitionRow[]>();
	for (const e of exhibitions as ExhibitionRow[]) {
		const list = exhibitionsByMuseum.get(e.museum_id) ?? [];
		list.push(e);
		exhibitionsByMuseum.set(e.museum_id, list);
	}
	const museumIds = [...exhibitionsByMuseum.keys()];

	// 그 전시관을 팔로우한 유저
	const { data: follows, error: followErr } = await supabase
		.from('venue_follows')
		.select('user_id, museum_id')
		.in('museum_id', museumIds);

	if (followErr || !follows?.length) {
		return new Response(JSON.stringify({ sent: 0, reason: followErr?.message ?? 'no follows' }));
	}

	const { data: museums } = await supabase.from('museums').select('id, name').in('id', museumIds);
	const museumById = new Map((museums as MuseumRow[] | null)?.map((m) => [m.id, m]) ?? []);

	const userIds = [...new Set(follows.map((f) => f.user_id))];
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
		follows as FollowRow[],
		exhibitionsByMuseum,
		museumById,
		profiles as ProfileRow[],
	);
	const sent = await sendAndLog(supabase, records);

	return new Response(JSON.stringify({ sent }), {
		headers: { 'Content-Type': 'application/json' },
	});
});
