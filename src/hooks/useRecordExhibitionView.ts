import { useEffect } from 'react';

import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';

/** 같은 앱 세션 안에서 동일 (user, exhibition, date) 조합을 반복 전송하지 않기 위한 캐시 */
const recordedKeys = new Set<string>();

/** 로컬 기준 오늘 날짜 키 (세션 내 중복 억제용, DB 값은 서버 default를 사용한다) */
function todayViewKey(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * 로그인 사용자의 전시 상세 조회를 하루 1회 기록한다.
 * - 비로그인 사용자는 네트워크 호출 자체를 하지 않는다.
 * - 중복은 세션 캐시 + DB unique 제약(on conflict do nothing) 2단으로 막는다.
 * - 실패는 사용자에게 노출하지 않고 조용히 무시한다.
 */
export function useRecordExhibitionView(exhibitionId: string | undefined, enabled = true) {
	const userId = useAuthStore((s) => s.user?.id);

	useEffect(() => {
		if (!userId) return;
		if (!exhibitionId) return;
		if (!enabled) return;

		const key = `${userId}:${exhibitionId}:${todayViewKey()}`;

		if (recordedKeys.has(key)) return;

		recordedKeys.add(key);

		void supabase
			.from('exhibition_views')
			.upsert(
				{ user_id: userId, exhibition_id: exhibitionId },
				{ onConflict: 'user_id,exhibition_id,viewed_date', ignoreDuplicates: true },
			)
			.then(({ error }) => {
				if (!error) return;
				// 실패한 요청은 다음 진입 때 재시도할 수 있도록 캐시에서 제거한다.
				recordedKeys.delete(key);
				console.warn('[exhibition-view] record failed:', error.message);
			});
	}, [userId, exhibitionId, enabled]);
}
