import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';

const FLIP_MS = 420;

interface FlapTileProps {
	char: string;
	/** 순서대로 넘어가도록 타일마다 주는 지연 */
	delay?: number;
}

/** 출발 안내판 플랩 한 장 — 처음 보일 때와 글자가 바뀔 때 위에서 아래로 넘어간다 */
export function FlapTile({ char, delay = 0 }: FlapTileProps) {
	const rotateX = useSharedValue(-90);

	useEffect(() => {
		rotateX.value = -90;
		rotateX.value = withDelay(
			delay,
			withTiming(0, { duration: FLIP_MS, easing: Easing.out(Easing.cubic) }),
		);
	}, [char, delay, rotateX]);

	const flipStyle = useAnimatedStyle(() => ({
		transform: [{ perspective: 400 }, { rotateX: `${rotateX.value}deg` }],
	}));

	return (
		<View className="h-[60px] w-10 overflow-hidden rounded-md bg-bg-tonal">
			<Animated.View className="flex-1 items-center justify-center" style={flipStyle}>
				<Text className="text-brand text-[36px] font-hahmlet-bold">{char}</Text>
			</Animated.View>
			<View className="absolute left-0 right-0 top-[29px] h-[1.5px] bg-bg-light" />
		</View>
	);
}
