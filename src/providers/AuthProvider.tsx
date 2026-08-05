import * as Linking from 'expo-linking';
import { useEffect, type ReactNode } from 'react';

import { useAuthStore } from '@/src/store/authStore';
import { createSessionFromUrl } from '@/src/utils/authOAuth';
import { supabase } from '@/src/utils/supabase';

type Props = {
	children: ReactNode;
};

export function AuthProvider({ children }: Props) {
	const setAuth = useAuthStore((s) => s.setAuth);
	const setLoading = useAuthStore((s) => s.setLoading);
	const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

	useEffect(() => {
		let mounted = true;

		const fetchOnboardingStatus = async (userId: string) => {
			const { data } = await supabase
				.from('profiles')
				.select('onboarding_completed')
				.eq('id', userId)
				.single();
			if (mounted && data) {
				setOnboardingCompleted(data.onboarding_completed ?? false);
			}
		};

		const init = async () => {
			const { data, error } = await supabase.auth.getSession();
			if (!mounted) return;
			if (error) console.warn('[auth] getSession', error.message);
			setAuth(data.session ?? null);
			if (data.session?.user) {
				await fetchOnboardingStatus(data.session.user.id);
			}
			setLoading(false);
		};

		void init();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setAuth(session);
			setLoading(false);
		});

		const handleUrl = (url: string) => {
			if (!url.includes('auth/callback')) return;
			void createSessionFromUrl(url).catch((e) => {
				console.warn('[auth] callback', e);
			});
		};

		const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
		void Linking.getInitialURL().then((url) => {
			if (url) handleUrl(url);
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
			sub.remove();
		};
	}, [setAuth, setLoading]);

	return children;
}
