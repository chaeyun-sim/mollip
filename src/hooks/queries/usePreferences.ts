import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/utils/supabase';

export interface Preferences {
	preferredGenres: string[];
	preferredArtists: string[];
}

const EMPTY_PREFERENCES: Preferences = {
	preferredGenres: [],
	preferredArtists: [],
};

const PREFERENCES_STALE_MS = 5 * 60 * 1000;

export function preferencesQueryKey(userId: string) {
	return ['profile', 'preferences', userId] as const;
}

async function fetchPreferences(userId: string): Promise<Preferences> {
	const { data, error } = await supabase
		.from('profiles')
		.select('preferred_genres, preferred_artists')
		.eq('id', userId)
		.single();

	if (error) throw error;
	return {
		preferredGenres: data?.preferred_genres ?? [],
		preferredArtists: data?.preferred_artists ?? [],
	};
}

export function usePreferences(userId: string | undefined): Preferences {
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

	return query.data ?? EMPTY_PREFERENCES;
}
