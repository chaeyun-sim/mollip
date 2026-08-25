import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

export function VoiceListSkeletonItem() {
	const opacity = useSharedValue(1);

	useEffect(() => {
		opacity.value = withRepeat(
			withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		);
	}, [opacity]);

	const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<Animated.View
			style={animStyle}
			className="flex-row items-center rounded-[20px] px-4 h-[76px] bg-bg-tonal gap-3"
		>
			<View className="w-11 h-11 rounded-full bg-black/5" />
			<View className="flex-1 gap-2">
				<View className="h-[13px] w-1/3 rounded-[6px] bg-black/5" />
				<View className="h-[11px] w-2/3 rounded-[6px] bg-black/5" />
			</View>
		</Animated.View>
	);
}
