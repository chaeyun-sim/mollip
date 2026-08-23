import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/src/utils/supabase';
import { useBookmarkStore } from './bookmarkStore';
import { useBookmarkAudioStore } from './bookmarkAudioStore';
import { useHistoryStore } from './historyStore';
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
	setAuth: (session) =>
		set({
			session,
			user: session?.user ?? null,
			// 로그아웃하면 온보딩 상태도 초기화
			onboardingCompleted: null,
		}),
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
	},
}));

export function getAccessTokenForApi(): string {
	const token = useAuthStore.getState().session?.access_token;
	const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
	return token ?? anon;
}
