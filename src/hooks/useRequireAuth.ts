import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuthStore } from '@/src/store/authStore';

/** 세션이 없으면 로그인 화면으로 보내고 false */
export function useRequireAuth() {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);

	const ensureAuth = useCallback(
		(returnTo: string): boolean => {
			if (session) return true;
			const path = returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
			router.push({
				pathname: '/auth/login',
				params: { returnTo: path },
			});
			return false;
		},
		[router, session],
	);

	return { session, ensureAuth, isAuthenticated: !!session };
}

export function authDisplayLabel(user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>): string {
	const meta = user.user_metadata as Record<string, unknown> | undefined;
	const name =
		(typeof meta?.full_name === 'string' && meta.full_name) ||
		(typeof meta?.name === 'string' && meta.name) ||
		(typeof meta?.nickname === 'string' && meta.nickname);
	if (name) return name;
	if (user.email) return user.email;
	const provider = user.app_metadata?.provider;
	if (provider === 'kakao') return '카카오 계정';
	if (provider === 'apple') return 'Apple 계정';
	return '로그인됨';
}
