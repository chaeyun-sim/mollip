import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/src/store/authStore';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';

interface SubscriptionPendingInput {
	isSubscriptionLoading: boolean;
	profileSyncedUserId: string | null;
}

/**
 * 프리미엄 여부를 아직 단정할 수 없는 상태인지 판정한다.
 * RevenueCat 부트스트랩 중이거나, 로그인했는데 이 사용자의 프로필 조회가 끝나지 않았을 때다.
 */
export const isSubscriptionPending = (
	{ isSubscriptionLoading, profileSyncedUserId }: SubscriptionPendingInput,
	userId: string | null,
) => isSubscriptionLoading || (userId !== null && profileSyncedUserId !== userId);

/**
 * 프리미엄 여부를 노출하는 단일 진입점.
 * subscriptionStore를 그대로 읽기만 한다 — 실제 값을 채우는 쪽은
 * `app/_layout.tsx`의 RevenueCat 동기화(`syncSubscription`)와 프로필 동기화뿐이다.
 */
export const useSubscription = () => {
	const userId = useAuthStore((s) => s.user?.id ?? null);
	return useSubscriptionStore(
		useShallow((s) => ({
			isPremium: s.isPremium,
			isLoading: isSubscriptionPending(s, userId),
		})),
	);
};
