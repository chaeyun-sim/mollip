/**
 * send-recommendations
 * 매주 월요일 오전 10시(KST) 실행 — pg_cron 스케줄: '0 1 * * 1' (UTC)
 *
 * 1. push_token 있는 프로필 + preferred_genres 조회
 * 2. 진행 중 전시에서 장르 매칭 top 3 선정
 * 3. Expo Push API 배치 전송 + 로그 기록
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendAndLog, type NotificationRecord } from '../_shared/pushNotify.ts';

interface ProfileRow {
	id: string;
	push_token: string;
	preferred_genres: string[];
	notification_prefs: { weekly_recommendation?: boolean };
}

interface ExhibitionRow {
	id: string | number;
	title: string;
	venue_name_fallback: string;
	genre: string | null;
}

function buildRecords(
	profiles: ProfileRow[],
	exhibitions: ExhibitionRow[],
	weekIndex: number,
): NotificationRecord[] {
	return profiles.flatMap((profile) => {
		if (profile.notification_prefs?.weekly_recommendation === false) return [];
		if (!profile.push_token.startsWith('ExponentPushToken')) return [];

		const genres = profile.preferred_genres;
		const matched = exhibitions.filter(
			(exhibition) => exhibition.genre && genres.includes(exhibition.genre),
		);
		const matchedIds = new Set(matched.map((exhibition) => String(exhibition.id)));
		const rest = exhibitions.filter((exhibition) => !matchedIds.has(String(exhibition.id)));
		const profileOffset = [...profile.id].reduce(
			(sum, character) => sum + character.charCodeAt(0),
			0,
		);
		// 주차·프로필마다 시작 위치를 바꿔 매주 같은 전시만 보내지 않는다.
		const rotate = (list: ExhibitionRow[], count: number) => {
			if (list.length === 0 || count <= 0) return [];
			const startIndex = (weekIndex * 3 + profileOffset) % list.length;
			return Array.from(
				{ length: Math.min(count, list.length) },
				(_, index) => list[(startIndex + index) % list.length],
			);
		};
		// 장르 매칭이 3개 이상이면 매칭 안에서만 순환하고, 부족할 때만 비매칭으로 채운다.
		const picks =
			matched.length >= 3 ? rotate(matched, 3) : [...matched, ...rotate(rest, 3 - matched.length)];

		if (picks.length === 0) return [];

		const body =
			picks.length === 1
				? `「${picks[0].title}」 — 지금 관람하기 좋아요`
				: `「${picks[0].title}」 외 ${picks.length - 1}개의 전시가 기다려요`;

		return [
			{
				userId: profile.id,
				token: profile.push_token,
				type: 'weekly_recommendation',
				title: '이번 주 추천 전시',
				body,
				data: { type: 'weekly_recommendation' },
			},
		];
	});
}

Deno.serve(async (req) => {
	// cron 전용 비밀값으로 인증한다 (게이트웨이 JWT 검증은 --no-verify-jwt로 끈다)
	const authHeader = req.headers.get('Authorization') ?? '';
	const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
	const supabase = createClient(supabaseUrl, serviceKey);

	const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

	// push_token 있는 프로필
	const { data: profiles, error: profileErr } = await supabase
		.from('profiles')
		.select('id, push_token, preferred_genres, notification_prefs')
		.not('push_token', 'is', null);

	if (profileErr || !profiles?.length) {
		return new Response(JSON.stringify({ sent: 0, reason: profileErr?.message ?? 'no profiles' }));
	}

	// 진행 중 전시 (최대 50개, 신선도 우선)
	const { data: exhibitions, error: exErr } = await supabase
		.from('exhibitions')
		.select('id, title, venue_name_fallback, genre, synced_at')
		.gte('end_date', today)
		.order('synced_at', { ascending: false })
		.limit(50);

	if (exErr || !exhibitions?.length) {
		return new Response(JSON.stringify({ sent: 0, reason: exErr?.message ?? 'no exhibitions' }));
	}

	const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
	const records = buildRecords(profiles as ProfileRow[], exhibitions as ExhibitionRow[], weekIndex);
	const sent = await sendAndLog(supabase, records);

	return new Response(JSON.stringify({ sent }), {
		headers: { 'Content-Type': 'application/json' },
	});
});
