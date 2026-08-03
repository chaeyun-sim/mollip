import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/src/utils/supabase';

type AuthStore = {
	session: Session | null;
	user: User | null;
	isLoading: boolean;
	setAuth: (session: Session | null) => void;
	setLoading: (loading: boolean) => void;
	signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
	session: null,
	user: null,
	isLoading: true,
	setAuth: (session) =>
		set({
			session,
			user: session?.user ?? null,
		}),
	setLoading: (isLoading) => set({ isLoading }),
	signOut: async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	},
}));

export function getAccessTokenForApi(): string {
	const token = useAuthStore.getState().session?.access_token;
	const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
	return token ?? anon;
}
