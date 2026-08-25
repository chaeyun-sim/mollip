import { useCallback, useState } from 'react';

import type { OnboardingArtItem } from '@/src/components/onboarding/OnboardingSwipeCard';

/** 취향 스와이프 덱의 카드/좋아요/완료 상태와 핸들러. 온보딩·취향 재설정 화면이 공유한다. */
export function useArtPreferenceSwipe(initialCards: OnboardingArtItem[] = []) {
	const [cards, setCards] = useState<OnboardingArtItem[]>(initialCards);
	const [liked, setLiked] = useState<OnboardingArtItem[]>([]);
	const [done, setDone] = useState(false);

	const handleSwipeLeft = useCallback(() => {
		setCards((prev) => {
			const next = prev.slice(1);
			if (next.length === 0) setDone(true);
			return next;
		});
	}, []);

	const handleSwipeRight = useCallback(() => {
		setCards((prev) => {
			setLiked((l) => [...l, prev[0]]);
			const next = prev.slice(1);
			if (next.length === 0) setDone(true);
			return next;
		});
	}, []);

	return { cards, setCards, liked, done, handleSwipeLeft, handleSwipeRight };
}
