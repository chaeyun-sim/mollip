import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface UsePressScaleOptions {
	pressedScale?: number;
	/** 지정 시 withSpring, 미지정 시 withTiming(100ms in / 150ms out)을 사용한다 */
	spring?: { damping: number };
}

/** Pressable press-in/out 시 scale 애니메이션을 주는 공용 훅. animatedStyle과 setPressed를 반환한다. */
export function usePressScale({ pressedScale = 0.97, spring }: UsePressScaleOptions = {}) {
	const scale = useSharedValue(1);
	const style = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const setPressed = (pressed: boolean) => {
		const target = pressed ? pressedScale : 1;
		scale.set(
			spring ? withSpring(target, spring) : withTiming(target, { duration: pressed ? 100 : 150 }),
		);
	};

	return { style, setPressed };
}
