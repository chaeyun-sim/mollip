import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';
import { useHistoryStore } from '../store/historyStore';
import type { HistoryItem } from '../store/historyStore';
import { supabase } from '../utils/supabase';

/**
 * 로그인 상태가 바뀔 때마다 Supabase에서 오디오 가이드 히스토리를 가져와
 * 로컬 스토어에 반영한다. 앱 루트(_layout.tsx)에서 마운트해야 한다.
 */
export function useHistorySync() {
	const userId = useAuthStore((s) => s.user?.id);
	const loadFromRemote = useHistoryStore((s) => s.loadFromRemote);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;

		supabase
			.from('audio_guides')
			.select('id, title, artist, image_url, full_text, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[history] load failed:', error.message);
					return;
				}
				if (data) {
					const items: HistoryItem[] = data.map((r) => ({
						id: r.id,
						title: r.title,
						artist: r.artist ?? undefined,
						imageUrl: r.image_url ?? undefined,
						text: r.full_text,
						savedAt: r.created_at,
					}));
					loadFromRemote(items);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote]);
}
