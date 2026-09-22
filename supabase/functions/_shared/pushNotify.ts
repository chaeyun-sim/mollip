/**
 * sendAndLog — Expo Push API로 발송 + notification_logs 테이블에 동시 기록.
 * 알림함(app/notifications) 화면은 이 로그 테이블을 읽어서 표시한다.
 */

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface NotificationRecord {
	userId: string;
	token: string;
	type: string;
	title: string;
	body: string;
	data?: Record<string, unknown>;
}

export async function sendAndLog(
	// deno-lint-ignore no-explicit-any
	supabase: SupabaseClient<any, any, any>,
	records: NotificationRecord[],
): Promise<number> {
	if (records.length === 0) return 0;

	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		await fetch(EXPO_PUSH_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(
				batch.map((r) => ({ to: r.token, title: r.title, body: r.body, data: r.data })),
			),
		});
	}

	const { error } = await supabase.from('notification_logs').insert(
		records.map((r) => ({
			user_id: r.userId,
			type: r.type,
			title: r.title,
			body: r.body,
			data: r.data ?? null,
		})),
	);
	if (error) console.warn('[notification_logs] insert failed:', error.message);

	return records.length;
}
