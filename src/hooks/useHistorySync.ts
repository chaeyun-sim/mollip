import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../store/authStore';
import { useHistoryStore } from '../store/historyStore';
import type { HistoryItem, StoredChatMessage } from '../store/historyStore';
import { supabase } from '../utils/supabase';

/**
 * 로그인 상태가 바뀔 때마다 Supabase에서 오디오 가이드 히스토리를 가져와
 * 로컬 스토어에 반영한다. 앱 루트(_layout.tsx)에서 마운트해야 한다.
 */
export function useHistorySync() {
	const userId = useAuthStore((s) => s.user?.id);
	const { loadFromRemote, setRemoteLoaded } = useHistoryStore(
		useShallow((s) => ({ loadFromRemote: s.loadFromRemote, setRemoteLoaded: s.setRemoteLoaded })),
	);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		// 사용자가 바뀌면 이전 동기화 결과를 믿지 않는다 — 다시 받을 때까지 로딩
		setRemoteLoaded(false);

		supabase
			.from('audio_guides')
			.select('id, title, artist, image_url, full_text, chat_messages, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[history] load failed:', error.message);
					// 실패해도 스켈레톤이 계속 돌지 않게 끝난 것으로 본다
					setRemoteLoaded(true);
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
						chatMessages: (r.chat_messages as StoredChatMessage[] | null) ?? undefined,
					}));
					loadFromRemote(items);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote, setRemoteLoaded]);
}
