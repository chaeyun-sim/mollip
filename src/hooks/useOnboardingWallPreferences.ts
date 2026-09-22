import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/src/utils/supabase';

export const useOnboardingWallPreferences = (
	userId: string | undefined,
	onLoad: (genres: string[], pieceIds?: string[]) => void,
) => {
	const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
	const request = useRef(0);
	useEffect(
		() => () => {
			request.current += 1;
		},
		[],
	);
	const load = useCallback(async () => {
		const current = ++request.current;
		setStatus('loading');
		if (!userId) {
			onLoad([]);
			setStatus('ready');
			return;
		}
		try {
			const { data, error } = await supabase
				.from('profiles')
				.select('preferred_genres, preferred_wall_piece_ids')
				.eq('id', userId)
				.single();
			if (current !== request.current) return;
			if (error) {
				setStatus('error');
				return;
			}
			onLoad(data?.preferred_genres ?? [], data?.preferred_wall_piece_ids ?? []);
			setStatus('ready');
		} catch {
			if (current === request.current) setStatus('error');
		}
	}, [userId, onLoad]);
	const cancel = useCallback(() => {
		request.current += 1;
	}, []);
	return { status, load, cancel };
};
