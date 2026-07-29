import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PlaylistItem {
	id: string;
	title: string;
	imageUrl?: string;
	description: string;
	addedAt: number;
}

interface ImmersiveStore {
	_hasHydrated: boolean;
	setHasHydrated: (value: boolean) => void;
	isImmersiveMode: boolean;
	exhibitionId: string | null;
	playlist: PlaylistItem[];
	enter: (exhibitionId: string) => void;
	exit: () => void;
	addToPlaylist: (item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
	setImmersiveMode: (value: boolean) => void;
}

export const useImmersiveStore = create<ImmersiveStore>()(
	persist(
		(set, get) => ({
			_hasHydrated: false,
			setHasHydrated: (value) => set({ _hasHydrated: value }),
			isImmersiveMode: false,
			exhibitionId: null,
			playlist: [],
			enter: (exhibitionId) => set({ isImmersiveMode: true, exhibitionId, playlist: [] }),
			exit: () => set({ isImmersiveMode: false, exhibitionId: null, playlist: [] }),
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
			setImmersiveMode: (val) => set({ isImmersiveMode: val })
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
