import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';
import { useVisitStore } from '../store/visitStore';
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
						const local = localVisits[r.date];
						visits[r.date] = {
							exhibitionId: r.exhibition_id ? String(r.exhibition_id) : null,
							listened: local?.listened ?? [],
							memo: r.memo ?? undefined,
							exhibitionTitle: local?.exhibitionTitle ?? r.exhibition_title ?? undefined,
							venue: local?.venue ?? r.venue ?? undefined,
							thumbnail: local?.thumbnail,
						};
					}
					// 원격에 없는 로컬 날짜도 유지 (예: 오프라인 기록)
					for (const [date, local] of Object.entries(localVisits)) {
						if (!visits[date]) visits[date] = local;
					}
					loadFromRemote(visits);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote]);
}
