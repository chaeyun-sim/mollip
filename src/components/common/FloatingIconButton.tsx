import { Pressable, PressableProps, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { cn } from '@/src/lib/cn';

export type FloatingIconButtonVariant = 'onLight' | 'onImage';

const VARIANT_BACKGROUND: Record<FloatingIconButtonVariant, string> = {
	onLight: 'bg-white/90',
	onImage: 'bg-white/80',
};

interface FloatingIconButtonProps extends PressableProps {
	onPress: () => void;
	icon: ReactNode;
	/** onLight: 다른 반투명 바 위(불투명도 높음, opacity press) / onImage: 사진 위 단독 배치(scale press) */
	variant?: FloatingIconButtonVariant;
	/** true면 onPress 전에 가벼운 haptic을 준다 */
	haptic?: boolean;
	style?: StyleProp<ViewStyle>;
}

/** 반투명 원형 배경 위 아이콘 버튼. variant가 배경 톤과 press 피드백 방식을 함께 결정한다. */
export function FloatingIconButton({
	onPress,
	icon,
	variant = 'onImage',
	haptic = false,
	style,
	...props
}: FloatingIconButtonProps) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const circleClassName = cn(
		'w-10 h-10 rounded-full items-center justify-center',
		VARIANT_BACKGROUND[variant],
	);

	const handlePress = () => {
		if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress();
	};

	if (variant === 'onLight') {
		return (
			<Pressable
				onPress={handlePress}
				style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
				accessibilityRole='button'
				hitSlop={8}
				{...props}
			>
				<View className={circleClassName}>{icon}</View>
			</Pressable>
		);
	}

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withTiming(0.92, { duration: 100 });
			}}
			onPressOut={() => {
				scale.value = withTiming(1, { duration: 150 });
			}}
			onPress={handlePress}
			style={style}
			accessibilityRole='button'
			hitSlop={8}
			{...props}
		>
			<Animated.View style={animatedStyle} className={circleClassName}>
				{icon}
			</Animated.View>
		</Pressable>
	);
}
