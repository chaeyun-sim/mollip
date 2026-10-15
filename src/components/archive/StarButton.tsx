import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

interface StarButtonProps {
	iconName: 'star' | 'star-half' | 'star-outline';
	size: number;
	iconClassName: string;
	onPress: (locationX: number) => void;
	disabled?: boolean;
	accessibilityLabel: string;
	accessibilityHint: string;
	selected: boolean;
}

/** 별 한 칸 — 탭하면 살짝 커졌다가 튕기며 돌아온다 (StarRating 전용) */
export function StarButton({
	iconName,
	size,
	iconClassName,
	onPress,
	disabled,
	accessibilityLabel,
	accessibilityHint,
	selected,
}: StarButtonProps) {
	const reduceMotion = useReducedMotion();
	const scale = useSharedValue(1);
	const rotate = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
	}));

	const handlePress = (locationX: number) => {
		onPress(locationX);
		if (reduceMotion) return;
		scale.set(
			withSequence(
				withTiming(1.35, { duration: 110 }),
				withSpring(1, { damping: 7, stiffness: 220 }),
			),
		);
		rotate.set(
			withSequence(
				withTiming(-14, { duration: 80 }),
				withSpring(0, { damping: 6, stiffness: 200 }),
			),
		);
	};

	return (
		<Pressable
			onPress={(event) => handlePress(event.nativeEvent.locationX)}
			disabled={disabled}
			hitSlop={6}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			accessibilityState={{ selected }}
		>
			<Animated.View style={animatedStyle}>
				<Ionicons name={iconName} size={size} className={iconClassName} />
			</Animated.View>
		</Pressable>
	);
}
