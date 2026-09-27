import { create } from 'zustand';

interface PurchaseTransactionState {
	/** 결과 확인이 필요한 거래가 있는지 여부(진행 중 구매 + 재실행 후 복원된 표식 모두 포함). */
	isPending: boolean;
	/** pending이 시작된 시각(ms). 자동 해제 시 이 시각 이후에 구매된 entitlement인지 비교한다. */
	pendingSince: number | null;
	/** 구매 버튼 탭부터 SDK purchasePackage 응답이 settle될 때까지 true. 타임아웃과 무관하다. */
	isPurchaseInFlight: boolean;
	/** markPending마다 증가한다. 비동기 재조회 도중 새 구매가 시작됐는지 판별하는 데 쓴다. */
	generation: number;
	/** pending을 시작하고 새 generation을 반환한다. */
	markPending: (since?: number) => number;
	clearPending: () => void;
	setPurchaseInFlight: (inFlight: boolean) => void;
	/**
	 * 진행 중 구매가 없고, 조회를 시작한 뒤 새 pending이 생기지 않았을 때만 pending을 해제한다.
	 * 해제했으면 true.
	 */
	clearPendingIfIdle: (expectedGeneration: number) => boolean;
}

export const usePurchaseTransactionStore = create<PurchaseTransactionState>((set, get) => ({
	isPending: false,
	pendingSince: null,
	isPurchaseInFlight: false,
	generation: 0,
	markPending: (since = Date.now()) => {
		const generation = get().generation + 1;
		set({ isPending: true, pendingSince: since, generation });
		return generation;
	},
	clearPending: () => set({ isPending: false, pendingSince: null }),
	setPurchaseInFlight: (isPurchaseInFlight) => set({ isPurchaseInFlight }),
	clearPendingIfIdle: (expectedGeneration) => {
		const { isPending, isPurchaseInFlight, generation } = get();
		if (!isPending || isPurchaseInFlight || generation !== expectedGeneration) return false;
		set({ isPending: false, pendingSince: null });
		return true;
	},
}));
