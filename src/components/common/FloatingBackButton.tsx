import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { cn } from '@/src/lib/cn';

interface FloatingBackButtonProps {
	onPress: () => void;
	backgroundClassName?: string;
	iconColor?: string;
	/** true면 누를 때 scale 애니메이션 적용 */
	animatePress?: boolean;
	/** 값이 있으면 누를 때 해당 opacity 적용 */
	pressedOpacity?: number;
	className?: string;
	style?: StyleProp<ViewStyle>;
}

/** 원형 뒤로가기 버튼. 배경·아이콘 색과 press 피드백 방식만 다르다. */
export function FloatingBackButton({
	onPress,
	backgroundClassName = 'bg-white/90',
	iconColor = '#1a1a1a',
	animatePress = false,
	pressedOpacity,
	className,
	style,
}: FloatingBackButtonProps) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const circleClassName = cn(
		'w-10 h-10 rounded-full items-center justify-center',
		backgroundClassName,
	);
	const icon = <Ionicons name='chevron-back' size={22} color={iconColor} />;

	const handlePressIn = () => {
		if (animatePress) scale.value = withTiming(0.92, { duration: 100 });
	};

	const handlePressOut = () => {
		if (animatePress) scale.value = withTiming(1, { duration: 150 });
	};

	function renderCircle() {
		if (animatePress) {
			return (
				<Animated.View className={circleClassName} style={animatedStyle}>
					{icon}
				</Animated.View>
			);
		}

		return <View className={circleClassName}>{icon}</View>;
	}

	return (
		<Pressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			className={className}
			style={({ pressed }) => [
				style,
				pressedOpacity === undefined
					? null
					: { opacity: pressed ? pressedOpacity : 1 },
			]}
			accessibilityLabel='뒤로가기'
			accessibilityRole='button'
			hitSlop={8}
		>
			{renderCircle()}
		</Pressable>
	);
}
