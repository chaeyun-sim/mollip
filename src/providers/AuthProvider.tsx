import * as Linking from 'expo-linking';
import { useEffect, type ReactNode } from 'react';

import { useAuthStore } from '@/src/store/authStore';
import { createSessionFromUrl } from '@/src/utils/authOAuth';
import { getLocalOnboardingCompleted } from '@/src/utils/onboardingLocalStorage';
import { resyncPendingOnboardingGenres } from '@/src/utils/onboardingSync';
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

		// 원격+로컬 완료 기록을 함께 판정한다 (AC-1, AC-5) — 둘 중 하나라도 true면 완료로 본다.
		// 저장 오류로 로컬에만 완료가 남은 경우, 이 시점에 pending 장르 재동기화도 함께 시도한다.
		const fetchOnboardingStatus = async (userId: string) => {
			const [{ data }, localCompleted] = await Promise.all([
				supabase.from('profiles').select('onboarding_completed').eq('id', userId).single(),
				getLocalOnboardingCompleted(userId),
			]);
			const remoteCompleted = data?.onboarding_completed ?? false;

			if (mounted) {
				setOnboardingCompleted(remoteCompleted || localCompleted);
			}

			if (remoteCompleted || localCompleted) {
				void resyncPendingOnboardingGenres(userId);
			}
		};

		const init = async () => {
			try {
				const { data, error } = await supabase.auth.getSession();
				if (!mounted) return;
				if (error) console.warn('[auth] getSession', error.message);
				setAuth(data.session ?? null);
				if (data.session?.user) {
					await fetchOnboardingStatus(data.session.user.id);
				}
			} catch (error) {
				console.warn('[auth] init failed:', error);
			} finally {
				if (mounted) setLoading(false);
			}
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
	}, [setAuth, setLoading, setOnboardingCompleted]);

	return children;
}
