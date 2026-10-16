import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { FRAME_SWING, Swingable } from '@/src/components/guide/Swingable';
import { ILLUSTRATION_COLORS as C } from '@/src/components/illustration/illustrationPalette';

interface EmptyWallIllustrationProps {
	width?: number;
}

/** 다이어리 빈 상태 — 아직 비어 있는 점선 액자 세 칸. 액자를 누르면 흔들린다 */
export function EmptyWallIllustration({ width = 240 }: EmptyWallIllustrationProps) {
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
				{/* 바닥 */}
				<Rect x="0" y="178" width="320" height="2" rx="1" fill={C.mushroom} />

				{/* 반짝임 */}
				<Path
					d="M274 30 v12 M268 36 h12"
					stroke={C.lightPlum}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<Path
					d="M40 24 v8 M36 28 h8"
					stroke={C.lightPlum}
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
				<Circle cx="296" cy="64" r="3" fill={C.peach} />
			</Svg>

			<Swingable
				motion={FRAME_SWING}
				x={36}
				y={56}
				width={64}
				height={84}
				scale={scale}
				accessibilityLabel="비어 있는 액자, 눌러 보세요"
			>
				<Rect
					x="1.5"
					y="1.5"
					width="61"
					height="81"
					rx="3"
					fill={C.white}
					stroke={C.mushroom}
					strokeWidth="3"
					strokeDasharray="7 5"
				/>
				<Path d="M32 34 v16 M24 42 h16" stroke={C.mushroom} strokeWidth="3" strokeLinecap="round" />
			</Swingable>

			<Swingable
				motion={FRAME_SWING}
				x={116}
				y={32}
				width={88}
				height={108}
				scale={scale}
				accessibilityLabel="비어 있는 액자, 눌러 보세요"
			>
				<Rect
					x="1.5"
					y="1.5"
					width="85"
					height="105"
					rx="3"
					fill={C.white}
					stroke={C.plum}
					strokeWidth="3"
					strokeDasharray="7 5"
				/>
				<Path d="M44 44 v20 M34 54 h20" stroke={C.plum} strokeWidth="3.5" strokeLinecap="round" />
			</Swingable>

			<Swingable
				motion={FRAME_SWING}
				x={220}
				y={64}
				width={64}
				height={76}
				scale={scale}
				accessibilityLabel="비어 있는 액자, 눌러 보세요"
			>
				<Rect
					x="1.5"
					y="1.5"
					width="61"
					height="73"
					rx="3"
					fill={C.white}
					stroke={C.mushroom}
					strokeWidth="3"
					strokeDasharray="7 5"
				/>
				<Path d="M32 28 v16 M24 36 h16" stroke={C.mushroom} strokeWidth="3" strokeLinecap="round" />
			</Swingable>
		</View>
	);
}
