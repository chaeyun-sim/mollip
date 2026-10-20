import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { FRAME_SWING, Swingable } from '@/src/components/guide/Swingable';
import { ILLUSTRATION_COLORS as C } from '@/src/components/illustration/illustrationPalette';

interface BookmarkEmptyIllustrationProps {
	width?: number;
}

/** 북마크 없음 — 도록 한 권과 그 옆의 비어 있는 점선 책갈피. 책갈피 자리를 누르면 팔랑인다 */
export function BookmarkEmptyIllustration({ width = 220 }: BookmarkEmptyIllustrationProps) {
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

				{/* 받침 책 */}
				<Rect x="52" y="156" width="152" height="22" rx="4" fill={C.oak} />
				<Rect x="60" y="160" width="136" height="4" rx="2" fill={C.blanket} />
				<Rect x="60" y="168" width="136" height="4" rx="2" fill={C.blanket} />

				{/* 세워 둔 도록 — 책갈피는 꽂혀 있지 않다 */}
				<Rect x="72" y="30" width="112" height="126" rx="6" fill={C.plum} />
				<Rect x="72" y="30" width="14" height="126" rx="4" fill={C.plumDark} />
				<Rect x="98" y="56" width="68" height="52" rx="2" fill={C.blanket} />
				<Circle cx="132" cy="78" r="11" fill={C.peach} />
				<Path d="M98 108 L98 96 Q116 84 132 94 Q148 86 166 98 L166 108 Z" fill={C.moss} />
				<Rect x="98" y="122" width="52" height="5" rx="2.5" fill={C.lightPlum} />
				<Rect x="98" y="134" width="34" height="5" rx="2.5" fill={C.lightPlum} />

				<Path
					d="M270 36 v12 M264 42 h12"
					stroke={C.lightPlum}
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<Circle cx="36" cy="70" r="3.5" fill={C.sky} />
			</Svg>

			{/* 아직 비어 있는 책갈피 자리 */}
			<Swingable
				motion={FRAME_SWING}
				x={216}
				y={48}
				width={44}
				height={104}
				scale={scale}
				accessibilityLabel="비어 있는 책갈피, 눌러 보세요"
			>
				<Path
					d="M3 3 H41 V99 L22 81 L3 99 Z"
					fill={C.white}
					stroke={C.mushroom}
					strokeWidth="3"
					strokeDasharray="7 5"
					strokeLinejoin="round"
				/>
				<Path d="M22 28 v20 M12 38 h20" stroke={C.mushroom} strokeWidth="3" strokeLinecap="round" />
			</Swingable>
		</View>
	);
}
