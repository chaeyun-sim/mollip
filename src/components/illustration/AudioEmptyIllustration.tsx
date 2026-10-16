import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { PLANT_SWING, Swingable } from '@/src/components/guide/Swingable';
import { ILLUSTRATION_COLORS as C } from '@/src/components/illustration/illustrationPalette';

interface AudioEmptyIllustrationProps {
	width?: number;
}

/** 저장된 오디오 없음 — 헤드폰 사이에 놓인 회색 X. X를 누르면 흔들린다 */
export function AudioEmptyIllustration({ width = 220 }: AudioEmptyIllustrationProps) {
	const scale = width / 320;
	const height = 200 * scale;

	return (
		<View style={{ width, height }}>
			<Svg
				width={width}
				height={height}
				viewBox="0 0 320 200"
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				<Rect x="0" y="178" width="320" height="2" rx="1" fill={C.mushroom} />

				{/* 헤드폰 */}
				<Path
					d="M92 124 C92 30 228 30 228 124"
					stroke={C.plum}
					strokeWidth="11"
					strokeLinecap="round"
					fill="none"
				/>
				<Rect x="76" y="112" width="32" height="56" rx="13" fill={C.lightPlum} />
				<Rect x="212" y="112" width="32" height="56" rx="13" fill={C.lightPlum} />

				<Path
					d="M270 44 v12 M264 50 h12"
					stroke={C.lightPlum}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<Circle cx="50" cy="70" r="3.5" fill={C.peach} />
				<Circle cx="276" cy="130" r="3" fill={C.sky} />
			</Svg>

			<Swingable
				motion={PLANT_SWING}
				x={140}
				y={76}
				width={40}
				height={40}
				scale={scale}
				accessibilityLabel="비어 있다는 표시, 눌러 보세요"
			>
				<Path d="M8 8 L32 32 M32 8 L8 32" stroke={C.gray} strokeWidth="8" strokeLinecap="round" />
			</Swingable>
		</View>
	);
}
