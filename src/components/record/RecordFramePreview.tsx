import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

import { FrameCard } from '@/src/components/archive/FrameCard';
import { buildPreviewItem, type PreviewInput } from '@/src/utils/museumWall';

const SWING_MS = 150;

interface RecordFramePreviewProps extends PreviewInput {
	/** true가 되면 액자가 벽에 걸리듯 한 번 흔들린다 */
	hung?: boolean;
	/** 작게 — 폼 위 미리보기로만 쓰는 화면(2단계)용 */
	compact?: boolean;
}

/** 기록 중인 전시가 벽에 걸릴 모습 — 입력할 때마다 액자와 캡션이 함께 채워진다 */
export function RecordFramePreview({
	hung = false,
	compact = false,
	...input
}: RecordFramePreviewProps) {
	const reduceMotion = useReducedMotion();
	const swing = useSharedValue(0);
	const drop = useSharedValue(-14);

	useEffect(() => {
		if (!hung || reduceMotion) return;
		drop.value = withTiming(0, { duration: SWING_MS });
		swing.value = withSequence(
			withTiming(5, { duration: SWING_MS }),
			withTiming(-3, { duration: SWING_MS }),
			withTiming(1.5, { duration: SWING_MS }),
			withTiming(0, { duration: SWING_MS }),
		);
	}, [hung, reduceMotion, swing, drop]);

	// 못에 매달린 것처럼 윗변 가운데를 축으로 흔든다
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: drop.value }, { rotate: `${swing.value}deg` }],
		transformOrigin: '50% 0%',
	}));

	return (
		<View className="items-center">
			<Animated.View
				className={compact ? 'w-[36%]' : 'w-[46%]'}
				style={hung && !reduceMotion ? animatedStyle : undefined}
			>
				<FrameCard item={buildPreviewItem(input)} compact={compact} />
			</Animated.View>
		</View>
	);
}
