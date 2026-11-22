import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { supabase } from '../utils/supabase';
import { createAuthAwareStorage } from '../utils/authAwareStorage';

interface BookmarkAudioStore {
	ids: string[];
	toggle: (audioGuideId: string, onError?: () => void) => void;
	isBookmarked: (audioGuideId: string) => boolean;
	/** 로그인 후 원격 bookmark_audio로 로컬 상태를 교체 */
	loadFromRemote: (ids: string[]) => void;
	/** 로그인 후 서버 동기화가 끝났는지 (실패해도 끝난 것으로 본다) — 로딩 스켈레톤용, 저장하지 않는다 */
	isRemoteLoaded: boolean;
	setRemoteLoaded: (isRemoteLoaded: boolean) => void;
}

export const useBookmarkAudioStore = create<BookmarkAudioStore>()(
	persist(
		(set, get) => ({
			ids: [],
			toggle: (audioGuideId, onError) => {
				const current = get().ids;
				const willAdd = !current.includes(audioGuideId);
				set({
					ids: willAdd ? [...current, audioGuideId] : current.filter((i) => i !== audioGuideId),
				});

				const userId = useAuthStore.getState().user?.id;
				if (!userId) return;

				if (willAdd) {
					supabase
						.from('bookmark_audio')
						.upsert({ user_id: userId, audio_guide_id: audioGuideId })
						.then(({ error }) => {
							if (error) {
								console.warn('[bookmark_audio] upsert failed:', error.message);
								set({ ids: current });
								onError?.();
							}
						});
				} else {
					supabase
						.from('bookmark_audio')
						.delete()
						.match({ user_id: userId, audio_guide_id: audioGuideId })
						.then(({ error }) => {
							if (error) {
								console.warn('[bookmark_audio] delete failed:', error.message);
								set({ ids: current });
								onError?.();
							}
						});
				}
			},
			isBookmarked: (id) => get().ids.includes(id),
			loadFromRemote: (ids) => set({ ids, isRemoteLoaded: true }),
			isRemoteLoaded: false,
			setRemoteLoaded: (isRemoteLoaded) => set({ isRemoteLoaded }),
		}),
		{
			name: 'bookmark-audio',
			storage: createJSONStorage(createAuthAwareStorage),
			partialize: (state) => ({ ids: state.ids }),
		},
	),
);
