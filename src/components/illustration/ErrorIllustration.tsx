import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SIDE_SWING, Swingable } from '@/src/components/guide/Swingable';
import { ILLUSTRATION_COLORS as C } from '@/src/components/illustration/illustrationPalette';

interface ErrorIllustrationProps {
	width?: number;
}

/** 오류·오프라인·없는 페이지 — 비어 있는 콘센트와 뽑혀 옆으로 늘어진 플러그. 플러그를 누르면 덜렁거린다 */
export function ErrorIllustration({ width = 220 }: ErrorIllustrationProps) {
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

				{/* 벽 콘센트 */}
				<Rect
					x="56"
					y="50"
					width="76"
					height="100"
					rx="16"
					fill={C.white}
					stroke={C.mushroom}
					strokeWidth="4"
				/>
				<Circle cx="94" cy="82" r="14" fill={C.mushroom} fillOpacity={0.5} />
				<Rect x="84" y="76" width="4.5" height="12" rx="2" fill={C.ink} />
				<Rect x="99.5" y="76" width="4.5" height="12" rx="2" fill={C.ink} />
				<Circle cx="94" cy="118" r="14" fill={C.mushroom} fillOpacity={0.5} />
				<Rect x="84" y="112" width="4.5" height="12" rx="2" fill={C.ink} />
				<Rect x="99.5" y="112" width="4.5" height="12" rx="2" fill={C.ink} />

				{/* 흩어진 점 */}
				<Circle cx="40" cy="38" r="3" fill={C.gray} />
				<Circle cx="270" cy="60" r="3.5" fill={C.gray} />
				<Path d="M200 150 v8 M196 154 h8" stroke={C.gray} strokeWidth="2.5" strokeLinecap="round" />
			</Svg>

			{/* 뽑혀 나온 플러그 — 코드가 옆으로 늘어진다. 코드 끝을 축으로 덜렁거린다 */}
			<Swingable
				motion={SIDE_SWING}
				x={148}
				y={100}
				width={150}
				height={40}
				scale={scale}
				accessibilityLabel="뽑힌 플러그, 눌러 보세요"
			>
				<Rect x="0" y="9" width="14" height="4.5" rx="2.2" fill={C.ink} />
				<Rect x="0" y="22" width="14" height="4.5" rx="2.2" fill={C.ink} />
				<Rect x="14" y="4" width="30" height="28" rx="8" fill={C.plum} />
				<Rect x="21" y="10" width="16" height="5" rx="2.5" fill={C.plumDark} />
				<Path
					d="M44 18 C66 8 78 30 98 20 S130 28 148 22"
					stroke={C.ink}
					strokeWidth="4.5"
					strokeLinecap="round"
					fill="none"
				/>
			</Swingable>
		</View>
	);
}
