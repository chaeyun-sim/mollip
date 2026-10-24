import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressScale } from '@/src/hooks/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps extends Omit<PressableProps, 'style'> {
	className?: string;
	style?: StyleProp<ViewStyle>;
	/** 눌렸을 때 줄어드는 비율 */
	pressedScale?: number;
}

/** 누르면 살짝 줄어들었다가 돌아오는 Pressable — 카드·목록 행 공용 */
export function ScalePressable({
	onPressIn,
	onPressOut,
	style,
	pressedScale = 0.98,
	...rest
}: ScalePressableProps) {
	// 스프링 없이 짧은 타이밍으로 — 튕기지 않고 살짝 눌렸다 돌아온다
	const { style: scaleStyle, setPressed } = usePressScale({ pressedScale });

	const handlePressIn = (event: GestureResponderEvent) => {
		setPressed(true);
		onPressIn?.(event);
	};

	const handlePressOut = (event: GestureResponderEvent) => {
		setPressed(false);
		onPressOut?.(event);
	};

	return (
		<AnimatedPressable
			{...rest}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[scaleStyle, style]}
		/>
	);
}
