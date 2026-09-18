import { useEffect, useState } from 'react';

import { supabase } from '@/src/utils/supabase';

interface VenueFollowStatusState {
	key: string | null;
	isFollowed: boolean;
	isLoading: boolean;
}

const initialState: VenueFollowStatusState = {
	key: null,
	isFollowed: false,
	isLoading: false,
};

export const useVenueFollowStatus = (userId?: string, museumId?: number) => {
	const [state, setState] = useState<VenueFollowStatusState>(initialState);
	const key = userId && museumId != null ? `${userId}:${museumId}` : null;

	useEffect(() => {
		let cancelled = false;

		if (!userId || museumId == null) {
			setState(initialState);
			return () => {
				cancelled = true;
			};
		}

		setState({ key, isFollowed: false, isLoading: true });

		void supabase
			.from('venue_follows')
			.select('museum_id')
			.eq('user_id', userId)
			.eq('museum_id', museumId)
			.maybeSingle()
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) console.warn('[venue-follow] status query failed:', error.message);
				setState({ key, isFollowed: Boolean(data) && !error, isLoading: false });
			});

		return () => {
			cancelled = true;
		};
	}, [key, museumId, userId]);

	const toggle = () => {
		if (!userId || museumId == null) return;

		const willFollow = !state.isFollowed;
		setState({ key, isFollowed: willFollow, isLoading: false });

		const mutation = willFollow
			? supabase.from('venue_follows').insert({ user_id: userId, museum_id: museumId })
			: supabase.from('venue_follows').delete().match({ user_id: userId, museum_id: museumId });

		void mutation.then(({ error }) => {
			if (!error) return;
			console.warn('[venue-follow] toggle failed:', error.message);
			setState({ key, isFollowed: !willFollow, isLoading: false });
		});
	};

	return {
		isFollowed: state.key === key && state.isFollowed,
		isLoading: key !== null && (state.key !== key || state.isLoading),
		toggle,
	};
};
