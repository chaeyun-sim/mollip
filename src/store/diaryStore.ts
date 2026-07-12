import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DiaryStore {
	// 날짜 키(YYYY-MM-DD)별 AI가 작성한 일기 본문
	entries: Record<string, string>;
	setEntry: (key: string, text: string) => void;
	clearEntry: (key: string) => void;
}

export const useDiaryStore = create<DiaryStore>()(
	persist(
		(set) => ({
			entries: {},
			setEntry: (key, text) =>
				set((state) => ({ entries: { ...state.entries, [key]: text } })),
			clearEntry: (key) =>
				set((state) => {
					const next = { ...state.entries };
					delete next[key];
					return { entries: next };
				}),
		}),
		{
			name: 'diary-entries',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
