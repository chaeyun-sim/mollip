import { useEffect, type ReactNode } from 'react';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

interface FadeInViewProps {
	children: ReactNode;
	delay?: number;
}

export function FadeInView({ children, delay = 0 }: FadeInViewProps) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(24);

	useEffect(() => {
		opacity.value = withDelay(delay, withTiming(1, { duration: 450 }));
		translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
	}, [delay, opacity, translateY]);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return <Animated.View style={style}>{children}</Animated.View>;
}
