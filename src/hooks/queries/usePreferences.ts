import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/utils/supabase';
import { EMPTY_PREFERRED_TASTE, normalizePreferredTaste } from '@/src/utils/preferredTaste';
import type { PreferredTasteDetails } from '@/src/utils/preferredTaste';

export interface Preferences {
	preferredGenres: string[];
	preferredArtists: string[];
	preferredTasteDetails: PreferredTasteDetails;
}

const EMPTY_PREFERENCES: Preferences = {
	preferredGenres: [],
	preferredArtists: [],
	preferredTasteDetails: EMPTY_PREFERRED_TASTE,
};

const PREFERENCES_STALE_MS = 5 * 60 * 1000;

export function preferencesQueryKey(userId: string) {
	return ['profile', 'preferences', userId] as const;
}

async function fetchPreferences(userId: string): Promise<Preferences> {
	const { data, error } = await supabase
		.from('profiles')
		.select('preferred_genres, preferred_artists, preferred_taste_details')
		.eq('id', userId)
		.single();

	// 새 취향 컬럼이 아직 배포되지 않은 DB에서도 기존 장르·작가 취향은 읽는다.
	if (error?.code === '42703' || error?.code === 'PGRST204') {
		const fallback = await supabase
			.from('profiles')
			.select('preferred_genres, preferred_artists')
			.eq('id', userId)
			.single();
		if (fallback.error) throw fallback.error;
		return {
			preferredGenres: fallback.data?.preferred_genres ?? [],
			preferredArtists: fallback.data?.preferred_artists ?? [],
			preferredTasteDetails: EMPTY_PREFERRED_TASTE,
		};
	}

	if (error) throw error;
	return {
		preferredGenres: data?.preferred_genres ?? [],
		preferredArtists: data?.preferred_artists ?? [],
		preferredTasteDetails: normalizePreferredTaste(data?.preferred_taste_details),
	};
}

export function usePreferences(
	userId: string | undefined,
): Preferences & { isLoading: boolean; isError: boolean } {
	const query = useQuery({
		queryKey: preferencesQueryKey(userId ?? ''),
		queryFn: () => {
			if (!userId) return EMPTY_PREFERENCES;
			return fetchPreferences(userId);
		},
		enabled: userId != null && userId !== '',
		staleTime: PREFERENCES_STALE_MS,
		retry: 1,
	});

	// isLoading: 첫 조회 중 — 이 동안의 빈 장르 목록은 "취향 없음"이 아니다.
	return {
		...(query.data ?? EMPTY_PREFERENCES),
		isLoading: query.isLoading,
		isError: query.isError,
	};
}
