import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from './authStore';
import { supabase } from '../utils/supabase';
import { createAuthAwareStorage } from '../utils/authAwareStorage';

export interface ListenedItem {
	title: string;
	imageUrl?: string;
	/** 생성된 해설 앞부분 — 아카이브에서 다시 읽기용 */
	descriptionPreview?: string;
}

// 하루치 관람 기록: 관람한 전시 + 들은 해설 목록 + 사용자 메모
export interface DayVisit {
	exhibitionId: string | null;
	exhibitionTitle?: string;
	venue?: string;
	thumbnail?: string;
	listened: ListenedItem[];
	/** 사용자가 직접 적는 관람 메모 (티켓 뒷면) */
	memo?: string;
}

interface VisitStore {
	// 날짜 키(YYYY-MM-DD)별 관람 기록
	visits: Record<string, DayVisit>;
	recordExhibition: (
		dateKey: string,
		exhibitionId: string | null,
		meta?: { title?: string; venue?: string; thumbnail?: string },
	) => void;
	recordListened: (dateKey: string, item: ListenedItem) => void;
	setVisitMemo: (dateKey: string, memo: string) => void;
	deleteVisit: (dateKey: string) => Promise<void>;
	/** 로그인 후 원격 visits로 로컬 상태를 교체 */
	loadFromRemote: (visits: Record<string, DayVisit>) => void;
}

export function todayKey(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
		now.getDate(),
	).padStart(2, '0')}`;
}

export const useVisitStore = create<VisitStore>()(
	persist(
		(set) => ({
			visits: {},
			recordExhibition: (dateKey, exhibitionId, meta) => {
				set((state) => {
					const prev = state.visits[dateKey];
					return {
						visits: {
							...state.visits,
							[dateKey]: {
								exhibitionId,
								exhibitionTitle: meta?.title ?? prev?.exhibitionTitle,
								venue: meta?.venue ?? prev?.venue,
								thumbnail: meta?.thumbnail ?? prev?.thumbnail,
								listened: prev?.listened ?? [],
							},
						},
					};
				});

				if (!exhibitionId) return;

				const userId = useAuthStore.getState().user?.id;
				if (userId) {
					supabase
						.from('visits')
						.upsert({
							user_id: userId,
							date: dateKey,
							exhibition_id: Number(exhibitionId) || null,
							exhibition_title: meta?.title ?? null,
							venue: meta?.venue ?? null,
						})
						.then(({ error }) => {
							if (error) console.warn('[visit] upsert failed:', error.message);
						});
				}
			},
			recordListened: (dateKey, item) =>
				set((state) => {
					const prev = state.visits[dateKey] ?? { exhibitionId: null, listened: [] };
					// 같은 제목은 하루에 한 번만 기록
					if (prev.listened.some((l) => l.title === item.title)) return state;
					return {
						visits: {
							...state.visits,
							[dateKey]: { ...prev, listened: [...prev.listened, item] },
						},
					};
				}),
			setVisitMemo: (dateKey, memo) => {
				set((state) => {
					const prev = state.visits[dateKey] ?? { exhibitionId: null, listened: [] };
					return {
						visits: {
							...state.visits,
							[dateKey]: { ...prev, memo },
						},
					};
				});

				const userId = useAuthStore.getState().user?.id;
				if (userId) {
					supabase
						.from('visits')
						.upsert({ user_id: userId, date: dateKey, memo })
						.then(({ error }) => {
							if (error) console.warn('[visit] memo upsert failed:', error.message);
						});
				}
			},
			deleteVisit: async (dateKey) => {
				set((state) => {
					const next = { ...state.visits };
					delete next[dateKey];
					return { visits: next };
				});

				const userId = useAuthStore.getState().user?.id;
				if (userId) {
					const { error } = await supabase
						.from('visits')
						.delete()
						.eq('user_id', userId)
						.eq('date', dateKey);
					if (error) console.warn('[visit] delete failed:', error.message);
				}
			},
			loadFromRemote: (visits) => set({ visits }),
		}),
		{
			name: 'visits',
			storage: createJSONStorage(createAuthAwareStorage),
		},
	),
);
