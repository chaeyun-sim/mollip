import { useCallback } from 'react';
import type { GestureResponderEvent, PressableProps } from 'react-native';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/src/store/authStore';

interface LoginRequiredPressableProps extends PressableProps {
	/** 로그인 후 되돌아올 경로 (예: '/(tabs)/diary') */
	returnTo?: string;
}

// 비로그인 상태에서 누르면 onPress 대신 로그인 화면으로 보내는 Pressable
export function LoginRequiredPressable({
	onPress,
	returnTo,
	...pressableProps
}: LoginRequiredPressableProps) {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);

	const handlePress = useCallback(
		(event: GestureResponderEvent) => {
			if (!session) {
				router.push({
					pathname: '/auth/login',
					params: returnTo ? { returnTo } : undefined,
				});
				return;
			}

			if (typeof onPress === 'function') {
				onPress(event);
			}
		},
		[session, onPress, router, returnTo],
	);

	return <Pressable onPress={handlePress} {...pressableProps} />;
}
