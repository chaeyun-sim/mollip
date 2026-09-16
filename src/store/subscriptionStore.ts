import { create } from 'zustand';

interface SubscriptionState {
	isPremium: boolean;
	isLoading: boolean;
	expiresAt?: string;
	setSubscription: (next: Pick<SubscriptionState, 'isPremium' | 'expiresAt'>) => void;
}

/**
 * 구독 상태 저장소. RevenueCat 연동 전까지는 isPremium이 항상 false인 스텁이다.
 * 나중에 useSubscription 내부에서 Purchases.getCustomerInfo() 결과로 setSubscription을 호출하면
 * 이 스토어를 구독하는 화면들은 코드 변경 없이 실제 구독 상태를 반영한다.
 */
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
	isPremium: false,
	isLoading: false,
	expiresAt: undefined,
	setSubscription: ({ isPremium, expiresAt }) => set({ isPremium, expiresAt, isLoading: false }),
}));
