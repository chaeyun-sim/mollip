import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface HistoryItem {
	id: string;
	text: string;
	title: string;
	artist?: string;
	imageUrl?: string;
	savedAt: string;
}

interface HistoryStore {
	items: HistoryItem[];
	add: (item: Omit<HistoryItem, 'id' | 'savedAt'>) => string;
	remove: (id: string) => void;
	update: (id: string, patch: Partial<Omit<HistoryItem, 'id' | 'savedAt'>>) => void;
	has: (id: string) => boolean;
}

export const useHistoryStore = create<HistoryStore>()(
	persist(
		(set, get) => ({
			items: [],
			add: (item) => {
				const id = Date.now().toString();
				set((s) => ({
					items: [{ ...item, id, savedAt: new Date().toISOString() }, ...s.items],
				}));
				return id;
			},
			remove: (id) => {
				set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
			},
			update: (id, patch) => {
				set((s) => ({
					items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
				}));
			},
			has: (id) => get().items.some((i) => i.id === id),
		}),
		{
			name: 'audio-history',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
