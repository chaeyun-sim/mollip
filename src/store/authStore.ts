import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/src/utils/supabase';
import { purgeAccountLocalCaches } from '@/src/utils/purgeAccountLocalCaches';
import { useBookmarkStore } from './bookmarkStore';
import { useBookmarkAudioStore } from './bookmarkAudioStore';
import { useHistoryStore } from './historyStore';
import { useImmersiveStore } from './immersiveStore';
import { useVisitStore } from './visitStore';

type AuthStore = {
	session: Session | null;
	user: User | null;
	isLoading: boolean;
	/** null = 아직 모름(로딩 중 또는 비로그인), true/false = DB에서 확인된 값 */
	onboardingCompleted: boolean | null;
	setAuth: (session: Session | null) => void;
	setLoading: (loading: boolean) => void;
	setOnboardingCompleted: (value: boolean) => void;
	signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
	session: null,
	user: null,
	isLoading: true,
	onboardingCompleted: null,
	setAuth: (session) => {
		set({
			session,
			user: session?.user ?? null,
			// 로그아웃하면 온보딩 상태도 초기화
			onboardingCompleted: null,
		});
		if (session) void purgeAccountLocalCaches('login');
		else {
			void useHistoryStore.getState().hydrateFromGuestDb();
			void useVisitStore.getState().hydrateFromLocalDb();
		}
	},
	setLoading: (isLoading) => set({ isLoading }),
	setOnboardingCompleted: (value) => set({ onboardingCompleted: value }),
	signOut: async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		// 로컬 유저 데이터 초기화 (다른 사용자 데이터 노출 방지)
		useBookmarkStore.setState({ ids: [] });
		useBookmarkAudioStore.setState({ ids: [] });
		useHistoryStore.setState({ items: [] });
		useVisitStore.setState({ visits: {} });
		useImmersiveStore.setState({
			isImmersiveMode: false,
			exhibitionId: null,
			exhibitionTitle: null,
			enteredAt: null,
			chatSessionId: null,
			playlist: [],
		});
		void purgeAccountLocalCaches('logout');
		void useHistoryStore.getState().hydrateFromGuestDb();
		void useVisitStore.getState().hydrateFromLocalDb();
	},
}));

/** 로그인 유저의 access token만 반환. 없으면 null — anon 키를 유저 토큰처럼 쓰지 않는다. */
export const getAccessTokenForApi = (): string | null => {
	return useAuthStore.getState().session?.access_token ?? null;
};
