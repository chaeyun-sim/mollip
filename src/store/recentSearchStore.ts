import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX_RECENT = 10;

interface RecentSearchStore {
	words: string[];
	add: (word: string) => void;
	remove: (word: string) => void;
	clear: () => void;
}

export const useRecentSearchStore = create<RecentSearchStore>()(
	persist(
		(set, get) => ({
			words: [],
			add: (word) => {
				const trimmed = word.trim();
				if (!trimmed) return;
				const rest = get().words.filter((w) => w !== trimmed);
				set({ words: [trimmed, ...rest].slice(0, MAX_RECENT) });
			},
			remove: (word) => set({ words: get().words.filter((w) => w !== word) }),
			clear: () => set({ words: [] }),
		}),
		{
			name: 'recent-searches',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
