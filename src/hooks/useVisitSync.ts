import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';
import { localVisitKeyFromRemote, upsertRemoteVisit, useVisitStore } from '../store/visitStore';
import type { DayVisit } from '../store/visitStore';
import { loadAllLocalVisits } from '../utils/localVisitDb';
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
				'visit_key, date, exhibition_id, memo, exhibition_title, venue, ticket_photo_url, venue_photo_urls',
			)
			.eq('user_id', userId)
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[visit] load failed:', error.message);
					return;
				}
				if (data) {
					// 사진·메모는 원격이 소스다. 로컬에는 status/서명처럼 DB에 없는 오버레이만 이어받는다.
					const localVisits = loadAllLocalVisits();
					const visits: Record<string, DayVisit> = {};
					for (const r of data) {
						const exhibitionId = r.exhibition_id ? String(r.exhibition_id) : null;
						const exhibitionTitle = r.exhibition_title ?? undefined;
						const key = localVisitKeyFromRemote(r.date, r.visit_key);
						const local = localVisits[key];
						visits[key] = {
							exhibitionId,
							listened: local?.listened ?? [],
							memo: r.memo ?? undefined,
							exhibitionTitle: local?.exhibitionTitle ?? exhibitionTitle,
							venue: local?.venue ?? r.venue ?? undefined,
							thumbnail: r.ticket_photo_url ?? undefined,
							venuePhotos:
								r.venue_photo_urls && r.venue_photo_urls.length > 0
									? r.venue_photo_urls
									: undefined,
							status: local?.status ?? (r.ticket_photo_url ? 'confirmed' : undefined),
							pendingSince: local?.pendingSince,
							signatureSvg: local?.signatureSvg,
							visitedAt: local?.visitedAt,
							rating: local?.rating,
						};
					}
					// 진행 중·미확정은 로컬 키로 유지. 같은 날 덮여서 원격에 없는 확정 기록은 다시 올린다.
					for (const [key, local] of Object.entries(localVisits)) {
						if (visits[key]) continue;
						if (local.status === 'pending' || local.status === 'in_progress') {
							visits[key] = {
								...local,
								thumbnail: undefined,
								venuePhotos: undefined,
								memo: undefined,
							};
							continue;
						}
						if (local.status !== 'confirmed') continue;
						if (!local.exhibitionId && !local.exhibitionTitle) continue;
						visits[key] = local;
						upsertRemoteVisit(userId, key, {
							exhibition_id: local.exhibitionId ? Number(local.exhibitionId) || null : null,
							exhibition_title: local.exhibitionTitle ?? null,
							venue: local.venue ?? null,
							...(local.thumbnail ? { ticket_photo_url: local.thumbnail } : {}),
							...(local.venuePhotos ? { venue_photo_urls: local.venuePhotos } : {}),
							...(local.memo ? { memo: local.memo } : {}),
						});
					}
					loadFromRemote(visits);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote]);
};
