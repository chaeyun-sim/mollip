import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PlaylistItem {
	id: string;
	title: string;
	artist?: string;
	year?: string;
	imageUrl?: string;
	description: string;
	addedAt: number;
}

interface ImmersiveStore {
	_hasHydrated: boolean;
	setHasHydrated: (value: boolean) => void;
	isImmersiveMode: boolean;
	exhibitionId: string | null;
	exhibitionTitle: string | null;
	playlist: PlaylistItem[];
	enter: (exhibitionId: string | null, exhibitionTitle?: string) => void;
	exit: () => void;
	addToPlaylist: (item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
}

export const useImmersiveStore = create<ImmersiveStore>()(
	persist(
		(set, get) => ({
			_hasHydrated: false,
			setHasHydrated: (value) => set({ _hasHydrated: value }),
			isImmersiveMode: false,
			exhibitionId: null,
			exhibitionTitle: null,
			playlist: [],
			enter: (exhibitionId, exhibitionTitle) =>
				set({ isImmersiveMode: true, exhibitionId, exhibitionTitle: exhibitionTitle ?? null, playlist: [] }),
			exit: () => set({ isImmersiveMode: false, exhibitionId: null, exhibitionTitle: null, playlist: [] }),
			addToPlaylist: (item) => {
				const exists = get().playlist.some((p) => p.title === item.title);
				if (exists) return;
				set((state) => ({
					playlist: [
						...state.playlist,
						{ ...item, id: `${Date.now()}-${Math.random()}`, addedAt: Date.now() },
					],
				}));
			},
		}),
		{
			name: 'immersive-store',
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);
