import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from './authStore';
import { supabase } from '../utils/supabase';

interface BookmarkAudioStore {
	ids: string[];
	toggle: (audioGuideId: string) => void;
	isBookmarked: (audioGuideId: string) => boolean;
	/** 로그인 후 원격 bookmark_audio로 로컬 상태를 교체 */
	loadFromRemote: (ids: string[]) => void;
}

export const useBookmarkAudioStore = create<BookmarkAudioStore>()(
	persist(
		(set, get) => ({
			ids: [],
			toggle: (audioGuideId) => {
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
							if (error) console.warn('[bookmark_audio] upsert failed:', error.message);
						});
				} else {
					supabase
						.from('bookmark_audio')
						.delete()
						.match({ user_id: userId, audio_guide_id: audioGuideId })
						.then(({ error }) => {
							if (error) console.warn('[bookmark_audio] delete failed:', error.message);
						});
				}
			},
			isBookmarked: (id) => get().ids.includes(id),
			loadFromRemote: (ids) => set({ ids }),
		}),
		{
			name: 'bookmark-audio',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
