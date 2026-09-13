import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';
import { makeVisitKey, useVisitStore } from '../store/visitStore';
import type { DayVisit } from '../store/visitStore';
import { supabase } from '../utils/supabase';

/**
 * 로그인 상태가 바뀔 때마다 Supabase에서 visits를 가져와
 * 로컬 스토어에 반영한다. 앱 루트(_layout.tsx)에서 마운트해야 한다.
 */
export function useVisitSync() {
	const userId = useAuthStore((s) => s.user?.id);
	const loadFromRemote = useVisitStore((s) => s.loadFromRemote);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;

		supabase
			.from('visits')
			.select('date, exhibition_id, memo, exhibition_title, venue')
			.eq('user_id', userId)
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[visit] load failed:', error.message);
					return;
				}
				if (data) {
					// listened/thumbnail은 Supabase에 저장되지 않으므로 로컬 값을 유지한다.
					// title/venue는 서버에도 기록해두므로, 로컬 캐시가 없어도(재설치·다른 기기) 복원 가능하다
					const localVisits = useVisitStore.getState().visits;
					const visits: Record<string, DayVisit> = {};
					for (const r of data) {
						const exhibitionId = r.exhibition_id ? String(r.exhibition_id) : null;
						const exhibitionTitle = r.exhibition_title ?? undefined;
						// Supabase는 (user_id, date) 단일 행이라 하루에 전시가 여러 개였으면
						// 원격에는 마지막 전시만 남아있다 — 로컬 makeVisitKey 항목과 매칭되는
						// 것만 덮어쓰고, 나머지 로컬 전용 키는 아래에서 그대로 보존한다.
						const key = makeVisitKey(r.date, exhibitionId, exhibitionTitle);
						const local = localVisits[key];
						visits[key] = {
							exhibitionId,
							listened: local?.listened ?? [],
							memo: r.memo ?? undefined,
							exhibitionTitle: local?.exhibitionTitle ?? exhibitionTitle,
							venue: local?.venue ?? r.venue ?? undefined,
							thumbnail: local?.thumbnail,
							// status/pendingSince/signatureSvg/visitedAt/rating은 아직 Supabase에 없는 컬럼이라
							// 로컬 값을 그대로 이어받는다 — 안 하면 미확정(pending) 기록이 재로그인/재시작마다
							// 확정으로 잘못 승격되고, 별점도 다이어리에서 사라진다.
							status: local?.status,
							pendingSince: local?.pendingSince,
							signatureSvg: local?.signatureSvg,
							visitedAt: local?.visitedAt,
							rating: local?.rating,
						};
					}
					// 원격에 없는 로컬 키도 유지 (예: 하루에 여러 전시 중 원격에 안 반영된 것, 오프라인 기록 등)
					for (const [key, local] of Object.entries(localVisits)) {
						if (!visits[key]) visits[key] = local;
					}
					loadFromRemote(visits);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote]);
}
