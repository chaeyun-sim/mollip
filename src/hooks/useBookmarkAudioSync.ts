import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../store/authStore';
import { useBookmarkAudioStore } from '../store/bookmarkAudioStore';
import { supabase } from '../utils/supabase';

/**
 * 로그인 상태가 바뀔 때마다 Supabase에서 오디오 북마크를 가져와
 * 로컬 스토어에 반영한다. 앱 루트(_layout.tsx)에서 마운트해야 한다.
 */
export function useBookmarkAudioSync() {
	const userId = useAuthStore((s) => s.user?.id);
	const { loadFromRemote, setRemoteLoaded } = useBookmarkAudioStore(
		useShallow((s) => ({ loadFromRemote: s.loadFromRemote, setRemoteLoaded: s.setRemoteLoaded })),
	);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		// 사용자가 바뀌면 이전 동기화 결과를 믿지 않는다 — 다시 받을 때까지 로딩
		setRemoteLoaded(false);

		supabase
			.from('bookmark_audio')
			.select('audio_guide_id')
			.eq('user_id', userId)
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.warn('[bookmark_audio] load failed:', error.message);
					// 실패해도 스켈레톤이 계속 돌지 않게 끝난 것으로 본다
					setRemoteLoaded(true);
					return;
				}
				if (data) {
					loadFromRemote(
						data.filter((r) => r.audio_guide_id !== null).map((r) => r.audio_guide_id as string),
					);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [userId, loadFromRemote, setRemoteLoaded]);
}
