import { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

interface SkeletonBoxProps extends ViewProps {
	className?: string;
}

export function SkeletonBox({ className, style, ...props }: SkeletonBoxProps) {
	const opacity = useSharedValue(1);

	useEffect(() => {
		opacity.value = withRepeat(
			withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		);
	}, [opacity]);

	const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return <Animated.View className={className} style={[animStyle, style]} {...props} />;
}
