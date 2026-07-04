import { create } from 'zustand';

interface MapState {
	selectedExhibitionId: string | null;
	selectExhibition: (id: string) => void;
	clearSelection: () => void;
}

export const useMapStore = create<MapState>((set) => ({
	selectedExhibitionId: null,
	selectExhibition: (id) => set({ selectedExhibitionId: id }),
	clearSelection: () => set({ selectedExhibitionId: null }),
}));
