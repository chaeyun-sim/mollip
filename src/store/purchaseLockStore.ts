import { create } from 'zustand';

interface PurchaseLockState {
	isLocked: boolean;
	lock: () => void;
	unlock: () => void;
}

/**
 * 루트에서 렌더되는 구매 완료 처리 오버레이의 잠금 상태.
 * premium 화면이 unmount(뒤로가기 이동)되어도 이 store는 모듈 전역이라 살아남는다.
 */
export const usePurchaseLockStore = create<PurchaseLockState>((set) => ({
	isLocked: false,
	lock: () => set({ isLocked: true }),
	unlock: () => set({ isLocked: false }),
}));
