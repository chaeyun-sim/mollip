import { useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { trackScreenView } from '@/src/lib/analytics';

interface ScreenAttempt {
	screenName: string;
	status: 'pending' | 'sent' | 'failed';
}

export function useAnalyticsScreenTracking(ready: boolean) {
	const segments = useSegments();
	const screenName = `/${segments.join('/')}`;
	const lastAttempt = useRef<ScreenAttempt | null>(null);

	useEffect(() => {
		if (!ready) return;

		const recordScreen = () => {
			const previous = lastAttempt.current;
			if (previous?.screenName === screenName && previous.status !== 'failed') return;
			const attempt: ScreenAttempt = { screenName, status: 'pending' };
			lastAttempt.current = attempt;
			void trackScreenView(screenName).then((sent) => {
				// 이전 화면의 늦은 응답은 그 요청만 갱신하고 현재 화면 추적 상태를 덮어쓰지 않는다.
				attempt.status = sent ? 'sent' : 'failed';
			});
		};
		recordScreen();
		const listener = AppState.addEventListener('change', (state) => {
			if (state === 'active') recordScreen();
		});
		return () => listener.remove();
	}, [ready, screenName]);
}
