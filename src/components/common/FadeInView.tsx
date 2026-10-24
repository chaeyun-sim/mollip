import { useEffect, type ReactNode } from 'react';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

interface FadeInViewProps {
	children: ReactNode;
	delay?: number;
	style?: StyleProp<ViewStyle>;
}

/** 등장 시 아래에서 위로 살짝 올라오며 페이드인하는 래퍼 — delay로 순차 등장 연출을 준다. */
export function FadeInView({ children, delay = 0, style }: FadeInViewProps) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(18);

	useEffect(() => {
		opacity.value = 0;
		translateY.value = 18;
		opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
		// 스프링 대신 ease-out — 목표 지점을 넘었다 돌아오는 바운스 없이 멈춘다
		translateY.value = withDelay(
			delay,
			withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
		);
	}, [delay, opacity, translateY]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
