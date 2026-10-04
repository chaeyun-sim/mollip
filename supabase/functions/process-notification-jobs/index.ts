/**
 * process-notification-jobs
 * pg_cron: 매분 실행. notification_jobs의 due 작업을 멱등적으로 처리한다.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendAndLog, type NotificationRecord } from '../_shared/pushNotify.ts';

type JobKind = 'notice' | 'venue_follow' | 'visit_review';

interface JobRow {
	id: string;
	kind: JobKind;
	dedupe_key: string;
	payload: Record<string, unknown>;
	attempts: number;
}

interface ProfileRow {
	id: string;
	push_token: string | null;
	notification_prefs: Record<string, boolean> | null;
}

const isExpoToken = (token: string | null): token is string =>
	typeof token === 'string' && token.startsWith('ExponentPushToken');

const profilesWithTokens = async (
	supabase: ReturnType<typeof createClient>,
	userIds?: string[],
): Promise<ProfileRow[]> => {
	let query = supabase
		.from('profiles')
		.select('id, push_token, notification_prefs')
		.not('push_token', 'is', null);
	if (userIds?.length) query = query.in('id', userIds);
	const { data, error } = await query;
	// 조회 실패를 빈 목록으로 삼키면 작업이 sent로 끝나고 아무에게도 안 가므로, 던져서 failed로 남긴다
	if (error) throw new Error(`profiles 조회 실패: ${error.message}`);
	return (data as ProfileRow[] | null) ?? [];
};

const buildNoticeRecords = async (
	supabase: ReturnType<typeof createClient>,
	payload: Record<string, unknown>,
): Promise<NotificationRecord[]> => {
	const profiles = await profilesWithTokens(supabase);
	const category = String(payload.category ?? 'general');
	const prefKey = category === 'version_update' || category === 'terms_update' ? category : null;

	return profiles.flatMap((profile) => {
		if (prefKey && profile.notification_prefs?.[prefKey] === false) return [];
		if (!isExpoToken(profile.push_token)) return [];
		return [
			{
				userId: profile.id,
				token: profile.push_token,
				type: `notice_${category}`,
				title: '',
				body: String(payload.title ?? payload.body ?? ''),
				data: { type: 'notice', noticeId: payload.id, category },
			},
		];
	});
};

const buildVenueRecords = async (
	supabase: ReturnType<typeof createClient>,
	payload: Record<string, unknown>,
): Promise<NotificationRecord[]> => {
	const exhibitionId = Number(payload.exhibitionId);
	const { data: exhibition } = await supabase
		.from('exhibitions')
		.select('id, title, museum_id')
		.eq('id', exhibitionId)
		.maybeSingle();
	if (!exhibition?.museum_id) return [];

	const { data: follows } = await supabase
		.from('venue_follows')
		.select('user_id, museum_id')
		.eq('museum_id', exhibition.museum_id);
	if (!follows?.length) return [];

	const userIds = [...new Set(follows.map((follow: { user_id: string }) => follow.user_id))];
	const profiles = await profilesWithTokens(supabase, userIds);
	const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
	const { data: museum } = await supabase
		.from('museums')
		.select('name')
		.eq('id', exhibition.museum_id)
		.maybeSingle();

	return follows.flatMap((follow: { user_id: string }) => {
		const profile = profileById.get(follow.user_id);
		if (!profile || profile.notification_prefs?.venue_follow === false) return [];
		if (!isExpoToken(profile.push_token)) return [];
		return [
			{
				userId: profile.id,
				token: profile.push_token,
				type: 'venue_follow',
				title: '',
				body: `팔로우 하고 있는 ${museum?.name ?? '팔로우한 전시관'}에서 새 전시가 기획되었어요!`,
				data: { type: 'venue_follow', museumId: exhibition.museum_id, exhibitionId },
			},
		];
	});
};

const buildVisitRecords = async (
	supabase: ReturnType<typeof createClient>,
	payload: Record<string, unknown>,
): Promise<NotificationRecord[]> => {
	const userId = String(payload.userId);
	const { data: visit } = await supabase
		.from('visits')
		.select('date, memo, exhibition_title')
		.eq('user_id', userId)
		.eq('visit_key', String(payload.visitKey))
		.eq('date', String(payload.date))
		.maybeSingle();
	if (!visit || visit.memo?.trim()) return [];

	const profiles = await profilesWithTokens(supabase, [userId]);
	const profile = profiles[0];
	if (!profile || profile.notification_prefs?.visit_review === false) return [];
	if (!isExpoToken(profile.push_token)) return [];

	return [
		{
			userId,
			token: profile.push_token,
			type: 'visit_review',
			title: '',
			body: '오늘 전시는 즐거우셨나요? 다이어리에서 기록해보세요!',
			data: { type: 'visit_review', date: visit.date },
		},
	];
};

const buildRecords = async (
	supabase: ReturnType<typeof createClient>,
	job: JobRow,
): Promise<NotificationRecord[]> => {
	if (job.kind === 'notice') return buildNoticeRecords(supabase, job.payload);
	if (job.kind === 'venue_follow') return buildVenueRecords(supabase, job.payload);
	return buildVisitRecords(supabase, job.payload);
};

Deno.serve(async (req) => {
	// cron 전용 비밀값으로 인증한다 (게이트웨이 JWT 검증은 --no-verify-jwt로 끈다)
	const authHeader = req.headers.get('Authorization') ?? '';
	const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
	}

	const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
	const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
	const { data: jobs, error: jobsError } = await supabase
		.from('notification_jobs')
		.select('id, kind, dedupe_key, payload, attempts')
		.eq('status', 'pending')
		.lte('send_at', new Date().toISOString())
		.order('send_at', { ascending: true })
		.limit(50);

	if (jobsError) {
		return new Response(JSON.stringify({ error: jobsError.message }), { status: 500 });
	}

	let processed = 0;
	for (const job of (jobs as JobRow[] | null) ?? []) {
		const { data: claimed } = await supabase
			.from('notification_jobs')
			.update({ status: 'processing', attempts: job.attempts + 1 })
			.eq('id', job.id)
			.eq('status', 'pending')
			.select('id')
			.maybeSingle();
		if (!claimed) continue;

		try {
			const records = await buildRecords(supabase, job);
			await sendAndLog(supabase, records);
			await supabase
				.from('notification_jobs')
				.update({ status: 'sent', processed_at: new Date().toISOString(), last_error: null })
				.eq('id', job.id);
			processed += 1;
		} catch (error) {
			await supabase
				.from('notification_jobs')
				.update({
					status: 'failed',
					last_error: error instanceof Error ? error.message : String(error),
				})
				.eq('id', job.id);
		}
	}

	return new Response(JSON.stringify({ processed, queued: jobs?.length ?? 0 }), {
		headers: { 'Content-Type': 'application/json' },
	});
});
