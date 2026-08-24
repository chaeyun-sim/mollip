import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from './authStore';
import { supabase } from '../utils/supabase';
import { createAuthAwareStorage } from '../utils/authAwareStorage';

interface BookmarkStore {
	ids: string[];
	toggle: (id: string) => void;
	isBookmarked: (id: string) => boolean;
	/** 로그인 후 원격 북마크로 로컬 상태를 교체 */
	loadFromRemote: (ids: string[]) => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
	persist(
		(set, get) => ({
			ids: [],
			toggle: (id) => {
				const current = get().ids;
				const willAdd = !current.includes(id);
				set({
					ids: willAdd ? [...current, id] : current.filter((i) => i !== id),
				});

				// 로그인 상태일 때 Supabase 동기화 (fire-and-forget)
				const userId = useAuthStore.getState().user?.id;
				if (!userId) return;

				if (willAdd) {
					supabase
						.from('bookmark_exhibitions')
						.upsert({ user_id: userId, exhibition_id: id })
						.then(({ error }) => {
							if (error) console.warn('[bookmark] upsert failed:', error.message);
						});
				} else {
					supabase
						.from('bookmark_exhibitions')
						.delete()
						.match({ user_id: userId, exhibition_id: id })
						.then(({ error }) => {
							if (error) console.warn('[bookmark] delete failed:', error.message);
						});
				}
			},
			isBookmarked: (id) => get().ids.includes(id),
			loadFromRemote: (ids) => set({ ids }),
		}),
		{
			name: 'bookmarks',
			storage: createJSONStorage(createAuthAwareStorage),
		},
	),
);
