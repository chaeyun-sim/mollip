import { useEffect, useState } from 'react';

import { supabase } from '@/src/utils/supabase';

export interface Preferences {
	preferredGenres: string[];
	preferredArtists: string[];
}

// @MX:NOTE: 온보딩에서 저장된 사용자 취향(선호 장르·작가)을 Supabase profiles 테이블에서 조회
// @MX:NOTE: userId가 undefined이면 즉시 빈 배열 반환 (비로그인 상태)
export function usePreferences(userId: string | undefined): Preferences {
	const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
	const [preferredArtists, setPreferredArtists] = useState<string[]>([]);

	useEffect(() => {
		if (!userId) return;
		supabase
			.from('profiles')
			.select('preferred_genres, preferred_artists')
			.eq('id', userId)
			.single()
			.then(({ data, error }) => {
				if (error) return; // 실패 시 빈 배열 유지 → 기존 로직 fallback
				setPreferredGenres(data?.preferred_genres ?? []);
				setPreferredArtists(data?.preferred_artists ?? []);
			});
	}, [userId]);

	return { preferredGenres, preferredArtists };
}
