import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { upsertRemoteVisit, useVisitStore } from '../store/visitStore';
import { deleteLocalVisit, loadAllLocalVisits } from '../utils/localVisitDb';
import { mergeRemoteVisits } from '../utils/mergeRemoteVisits';
import { supabase } from '../utils/supabase';

/**
 * 로그인 상태가 바뀔 때마다 Supabase에서 visits를 가져와
 * 로컬 스토어에 반영한다. 앱 루트(_layout.tsx)에서 마운트해야 한다.
 */
export const useVisitSync = () => {
	const userId = useAuthStore((s) => s.user?.id);
	const loadFromRemote = useVisitStore((s) => s.loadFromRemote);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;

		supabase
			.from('visits')
			.select(
				'visit_key, date, exhibition_id, memo, exhibition_title, venue, ticket_photo_url, venue_photo_urls, visit_status, visit_started_at, visit_ended_at, rating, listened, signature_svg, companion, keywords, is_revisit, pending_since, deleted_at',
			)
			.eq('user_id', userId)
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[visit] load failed:', error.message);
					return;
				}
				if (data) {
					const { visits, deletedKeys, uploads } = mergeRemoteVisits(data, loadAllLocalVisits());
					// 다른 기기에서 지운 기록은 이 기기에서도 지운다 — 남겨두면 다음 동기화 때 되살아난다
					for (const key of deletedKeys) deleteLocalVisit(key);
					for (const { key, patch } of uploads) upsertRemoteVisit(userId, key, patch);
					loadFromRemote(visits);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote]);
};
