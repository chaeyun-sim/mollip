import { Pressable, PressableProps, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import Animated from 'react-native-reanimated';

import { cn } from '@/src/lib/cn';
import { usePressScale } from '@/src/hooks/usePressScale';

export type FloatingIconButtonVariant = 'onLight' | 'onImage' | 'onPhoto';

const VARIANT_BACKGROUND: Record<FloatingIconButtonVariant, string> = {
	onLight: 'bg-white/90',
	onImage: 'bg-white/80',
	onPhoto: 'bg-black/40',
};

interface FloatingIconButtonProps extends PressableProps {
	onPress: () => void;
	icon: ReactNode;
	/** onLight: 다른 반투명 바 위(불투명도 높음, opacity press) / onImage: 사진 위 단독 배치(scale press) / onPhoto: 밝기를 예측할 수 없는 포스터·작품 이미지 위(어두운 배경 고정, scale press) — 아이콘은 흰색으로 전달 */
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
	const { style: animatedStyle, setPressed } = usePressScale({ pressedScale: 0.92 });

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
				accessibilityRole="button"
				hitSlop={8}
				{...props}
			>
				<View className={circleClassName}>{icon}</View>
			</Pressable>
		);
	}

	return (
		<Pressable
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			onPress={handlePress}
			style={style}
			accessibilityRole="button"
			hitSlop={8}
			{...props}
		>
			<Animated.View style={animatedStyle} className={circleClassName}>
				{icon}
			</Animated.View>
		</Pressable>
	);
}
