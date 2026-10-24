import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';

const SWING_MS = 150;

/** 액자 — 윗변에 매달려 한두 번 흔들리고 멈춘다 */
export const FRAME_SWING = { origin: '50% 0%', angles: [5, -3.5, 2, -1, 0] } as const;
/** 식물 — 화분 위 밑동을 축으로 이리저리 크게 흔들리다 잦아든다 */
export const PLANT_SWING = { origin: '54% 100%', angles: [9, -8, 6, -5, 3, -2, 1, 0] } as const;

/** 줄에 매달린 물건(헤드폰) — 윗점을 축으로 크게 덜렁거린다 */
export const DANGLE_SWING = { origin: '50% 0%', angles: [10, -8, 5, -3, 1, 0] } as const;
/** 손잡이 끝을 축으로 갸웃거리는 물건(돋보기) */
export const TILT_SWING = { origin: '50% 100%', angles: [-14, 10, -6, 3, 0] } as const;

/** 한쪽 끝이 고정된 채 옆으로 늘어진 물건(코드가 달린 플러그) — 오른쪽 끝을 축으로 흔들린다 */
export const SIDE_SWING = { origin: '100% 50%', angles: [7, -6, 4, -2, 1, 0] } as const;

interface SwingableProps {
	/** 흔들림의 축(transformOrigin)과 각도 순서 — FRAME_SWING·PLANT_SWING */
	motion: { origin: string; angles: readonly number[] };
	/** 일러스트 좌표계(viewBox)에서의 위치와 크기 */
	x: number;
	y: number;
	width: number;
	height: number;
	/** 일러스트 좌표 → 화면 px 배율 */
	scale: number;
	accessibilityLabel: string;
	/** 액자 안쪽을 (0,0)에서 시작하는 좌표로 그린 SVG 조각 */
	children: ReactNode;
}

/** 눌러 보면 흔들리는 일러스트 속 조각 — 액자는 기록을 남겼을 때 벽에 걸리던 움직임과 같다 */
export function Swingable({
	motion,
	x,
	y,
	width,
	height,
	scale,
	accessibilityLabel,
	children,
}: SwingableProps) {
	const reduceMotion = useReducedMotion();
	const swing = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${swing.value}deg` }],
		transformOrigin: motion.origin,
	}));

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		if (reduceMotion) return;
		swing.set(
			withSequence(
				...motion.angles.map((angle, index) =>
					withTiming(
						angle,
						index === 0
							? { duration: SWING_MS, easing: Easing.out(Easing.quad) }
							: { duration: SWING_MS * 1.2 },
					),
				),
			),
		);
	};

	return (
		<Animated.View
			className="absolute"
			style={[{ left: x * scale, top: y * scale }, animatedStyle]}
		>
			<Pressable
				onPress={handlePress}
				hitSlop={6}
				accessibilityRole="button"
				accessibilityLabel={accessibilityLabel}
			>
				<Svg width={width * scale} height={height * scale} viewBox={`0 0 ${width} ${height}`}>
					{children}
				</Svg>
			</Pressable>
		</Animated.View>
	);
}
