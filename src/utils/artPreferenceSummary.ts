import type { OnboardingArtItem } from '@/src/components/onboarding/OnboardingSwipeCard';

/** 좋아요한 카드에서 중복 제거된 선호 장르·작가 목록을 뽑는다. */
export function summarizeArtPreferences(liked: OnboardingArtItem[]) {
	const genres = [
		...new Set(
			liked.flatMap((item) =>
				[item.mainGenre, item.subGenre].filter((g): g is string => Boolean(g)),
			),
		),
	];
	const artists = [
		...new Set(liked.map((item) => item.artist).filter((a): a is string => Boolean(a?.trim()))),
	];
	return { genres, artists };
}
