import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import { supabase } from '../utils/supabase';

/**
 * 로그인 상태가 바뀔 때마다 Supabase에서 북마크를 가져와 로컬 스토어에 반영한다.
 * 앱 루트(_layout.tsx)에서 마운트해야 한다.
 */
export function useBookmarkSync() {
	const userId = useAuthStore((s) => s.user?.id);
	const loadFromRemote = useBookmarkStore((s) => s.loadFromRemote);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;

		supabase
			.from('bookmark_exhibitions')
			.select('exhibition_id')
			.eq('user_id', userId)
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[bookmark] load failed:', error.message);
					return;
				}
				if (data) loadFromRemote(data.map((r) => r.exhibition_id as string));
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote]);
}
