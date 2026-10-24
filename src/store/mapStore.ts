import { create } from 'zustand';

interface PendingCamera {
	latitude: number;
	longitude: number;
	venueName: string;
}

interface MapState {
	selectedVenueName: string | null;
	selectVenue: (venueName: string) => void;
	clearSelection: () => void;
	pendingCamera: PendingCamera | null;
	setPendingCamera: (camera: PendingCamera) => void;
	clearPendingCamera: () => void;
}

export const useMapStore = create<MapState>((set) => ({
	selectedVenueName: null,
	selectVenue: (venueName) => set({ selectedVenueName: venueName }),
	clearSelection: () => set({ selectedVenueName: null }),
	pendingCamera: null,
	setPendingCamera: (camera) => set({ pendingCamera: camera }),
	clearPendingCamera: () => set({ pendingCamera: null }),
}));
