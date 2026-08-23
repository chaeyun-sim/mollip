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
			.select('date, exhibition_id, memo')
			.eq('user_id', userId)
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[visit] load failed:', error.message);
					return;
				}
				if (data) {
					// 로컬 listened/exhibitionTitle/venue/thumbnail은 Supabase에 저장되지 않으므로
					// 원격 데이터와 병합하여 로컬 데이터가 덮어씌워지지 않도록 한다
					const localVisits = useVisitStore.getState().visits;
					const visits: Record<string, DayVisit> = {};
					for (const r of data) {
						const local = localVisits[r.date];
						visits[r.date] = {
							exhibitionId: r.exhibition_id ? String(r.exhibition_id) : null,
							listened: local?.listened ?? [],
							memo: r.memo ?? undefined,
							exhibitionTitle: local?.exhibitionTitle,
							venue: local?.venue,
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
