import { useEffect } from 'react';
import {
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

export function useHeroAnimation(exhibitionId: string | undefined) {
	const scrollY = useSharedValue(0);
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	// 데이터가 fade로 나타나는 것과 맞춰 히어로 이미지도 함께 fade-in (안 그러면 이미지만 뚝 나타남)
	const heroOpacity = useSharedValue(0);
	useEffect(() => {
		if (!exhibitionId) return;
		heroOpacity.value = 0;
		heroOpacity.value = withTiming(1, { duration: 450 });
	}, [exhibitionId]);

	const heroImageStyle = useAnimatedStyle(() => ({
		opacity: heroOpacity.value,
		transform: [{ translateY: scrollY.value * 0.35 }],
	}));

	return { scrollHandler, heroImageStyle };
}
