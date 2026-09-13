import { clearPendingGenres, getPendingGenres } from '@/src/utils/onboardingLocalStorage';
import { supabase } from '@/src/utils/supabase';

/**
 * 사용자별 로컬 pending 장르가 있으면 서버에 재동기화를 시도한다 (AC-5).
 * 실패해도 pending 레코드를 지우지 않아 다음 인증 가능 시점에 다시 시도된다.
 */
export async function resyncPendingOnboardingGenres(userId: string): Promise<void> {
	const pending = await getPendingGenres(userId);
	if (!pending) return;

	const { error } = await supabase
		.from('profiles')
		.update({ preferred_genres: pending.genres, onboarding_completed: true })
		.eq('id', userId);

	if (error) {
		console.warn('[onboarding] pending genres resync failed:', error.message);
		return;
	}

	await clearPendingGenres(userId);
}
