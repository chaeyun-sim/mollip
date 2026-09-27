import { create } from 'zustand';

export type PurchaseOperation = 'purchase' | 'restore' | null;

interface PurchaseOperationState {
	operation: PurchaseOperation;
	acquire: (operation: Exclude<PurchaseOperation, null>) => boolean;
	release: (operation: Exclude<PurchaseOperation, null>) => void;
}

export const usePurchaseOperationStore = create<PurchaseOperationState>((set, get) => ({
	operation: null,
	acquire: (operation) => {
		if (get().operation !== null) return false;
		set({ operation });
		return true;
	},
	release: (operation) => {
		if (get().operation === operation) set({ operation: null });
	},
}));
