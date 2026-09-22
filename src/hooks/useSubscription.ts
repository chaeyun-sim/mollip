import { useShallow } from 'zustand/react/shallow';

import { useSubscriptionStore } from '@/src/store/subscriptionStore';

/**
 * 프리미엄 여부를 노출하는 단일 진입점.
 * subscriptionStore를 그대로 읽기만 한다 — 실제 값을 채우는 쪽은
 * `app/_layout.tsx`의 RevenueCat 동기화(`syncSubscription`)뿐이다.
 */
export const useSubscription = () => {
	return useSubscriptionStore(
		useShallow((s) => ({ isPremium: s.isPremium, isLoading: s.isSubscriptionLoading })),
	);
};
