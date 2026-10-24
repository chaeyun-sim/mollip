import { View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { PLANT_SWING, Swingable } from '@/src/components/guide/Swingable';
import { ILLUSTRATION_COLORS as C } from '@/src/components/illustration/illustrationPalette';

interface PottedPlantIllustrationProps {
	width?: number;
}

export function PottedPlantIllustration({ width = 64 }: PottedPlantIllustrationProps) {
	const height = (width * 70) / 56;
	const scale = width / 56;

	return (
		<View style={{ width, height }}>
			<Svg
				width={width}
				height={height}
				viewBox="0 0 56 70"
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				<Ellipse cx="28" cy="68" rx="22" ry="2" fill={C.mushroom} opacity={0.45} />
				<Path d="M10 68 L14 42 L38 42 L42 68 Z" fill={C.oak} />
			</Svg>
			<Swingable
				motion={PLANT_SWING}
				x={0}
				y={0}
				width={48}
				height={42}
				scale={scale}
				accessibilityLabel="화분 속 식물, 눌러 흔들어 보세요"
			>
				<Path d="M26 42 C18 24 14 12 22 0 C28 10 30 22 26 42 Z" fill={C.moss} />
				<Path d="M26 42 C32 26 42 20 48 14 C46 28 38 38 26 42 Z" fill={C.moss} />
				<Path d="M26 42 C18 32 6 30 0 24 C4 36 14 42 26 42 Z" fill={C.moss} />
			</Swingable>
		</View>
	);
}
