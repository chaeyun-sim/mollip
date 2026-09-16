import { useShallow } from 'zustand/react/shallow';

import { useSubscriptionStore } from '@/src/store/subscriptionStore';

/**
 * 프리미엄 여부를 노출하는 단일 진입점.
 * 지금은 subscriptionStore의 스텁 값(isPremium: false)을 그대로 반환하지만,
 * RevenueCat을 붙일 때는 이 훅 내부만 Purchases.getCustomerInfo() 조회로 교체하면 된다 —
 * 화면 쪽 호출부(const { isPremium } = useSubscription())는 그대로 유지된다.
 */
export const useSubscription = () => {
	return useSubscriptionStore(
		useShallow((s) => ({ isPremium: s.isPremium, isLoading: s.isLoading, expiresAt: s.expiresAt })),
	);
};
