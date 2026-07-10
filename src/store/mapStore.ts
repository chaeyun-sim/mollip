import { create } from 'zustand';

interface MapState {
	selectedVenueName: string | null;
	selectVenue: (venueName: string) => void;
	clearSelection: () => void;
}

export const useMapStore = create<MapState>((set) => ({
	selectedVenueName: null,
	selectVenue: (venueName) => set({ selectedVenueName: venueName }),
	clearSelection: () => set({ selectedVenueName: null }),
}));
