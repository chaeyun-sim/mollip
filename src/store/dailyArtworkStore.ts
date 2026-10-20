import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DAILY_ARTWORKS } from '@/src/data/dailyArtworks';
import {
	markDailyArtworkListened,
	resolveDailyArtworkProgress,
	toDayKey,
	type DailyArtworkProgress,
} from '@/src/utils/dailyArtworkProgress';
import { getDailyIndex } from '@/src/utils/homeExhibitionMeta';

interface DailyArtworkStore extends DailyArtworkProgress {
	/** AsyncStorage 복원 완료 여부 — 복원 전에는 기본값이라 화면에 그리지 않는다 */
	hasHydrated: boolean;
	/** 날짜가 바뀌었으면 진행 상태를 오늘 기준으로 맞춘다 */
	syncToday: () => void;
	/** 오늘 이 그림의 해설을 들었다고 기록한다 */
	markListened: () => void;
}

export const useDailyArtworkStore = create<DailyArtworkStore>()(
	persist(
		(set, get) => ({
			// 첫 설치 시작점은 날짜로 정해 사용자마다 다른 그림에서 시작하게 한다
			index: getDailyIndex(new Date(), DAILY_ARTWORKS.length),
			listenedOn: null,
			hasHydrated: false,
			syncToday: () => {
				const { index, listenedOn } = get();
				const next = resolveDailyArtworkProgress(
					{ index, listenedOn },
					toDayKey(new Date()),
					DAILY_ARTWORKS.length,
				);
				if (next.index !== index || next.listenedOn !== listenedOn) set(next);
			},
			markListened: () => {
				const { index, listenedOn } = get();
				set(markDailyArtworkListened({ index, listenedOn }, toDayKey(new Date())));
			},
		}),
		{
			name: 'daily-artwork-progress',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({ index: state.index, listenedOn: state.listenedOn }),
			onRehydrateStorage: () => (state) => {
				state?.syncToday();
				useDailyArtworkStore.setState({ hasHydrated: true });
			},
		},
	),
);
