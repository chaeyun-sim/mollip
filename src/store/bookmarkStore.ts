import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BookmarkStore {
	ids: string[];
	toggle: (id: string) => void;
	isBookmarked: (id: string) => boolean;
}

export const useBookmarkStore = create<BookmarkStore>()(
	persist(
		(set, get) => ({
			ids: [],
			toggle: (id) => {
				const current = get().ids;
				set({
					ids: current.includes(id)
						? current.filter((i) => i !== id)
						: [...current, id],
				});
			},
			isBookmarked: (id) => get().ids.includes(id),
		}),
		{
			name: 'bookmarks',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
