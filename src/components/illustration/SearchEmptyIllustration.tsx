import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Swingable, TILT_SWING } from '@/src/components/guide/Swingable';
import { ILLUSTRATION_COLORS as C } from '@/src/components/illustration/illustrationPalette';

interface SearchEmptyIllustrationProps {
	width?: number;
}

/** 검색 결과 없음 — 갸우뚱하는 얼굴의 돋보기. 돋보기를 누르면 갸웃거린다 */
export function SearchEmptyIllustration({ width = 220 }: SearchEmptyIllustrationProps) {
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

				{/* 떠다니는 물음표 */}
				<Path
					d="M232 38 C232 26 252 26 252 38 C252 46 242 46 242 54"
					stroke={C.lightPlum}
					strokeWidth="6"
					strokeLinecap="round"
					fill="none"
				/>
				<Circle cx="242" cy="64" r="3.5" fill={C.lightPlum} />
				<Path
					d="M268 72 C268 65 279 65 279 72 C279 77 273 77 273 82"
					stroke={C.mushroom}
					strokeWidth="4"
					strokeLinecap="round"
					fill="none"
				/>
				<Circle cx="273" cy="88" r="2.5" fill={C.mushroom} />
				<Circle cx="62" cy="60" r="3.5" fill={C.sky} />
				<Path
					d="M52 128 v10 M47 133 h10"
					stroke={C.lightPlum}
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
			</Svg>

			<Swingable
				motion={TILT_SWING}
				x={96}
				y={30}
				width={128}
				height={146}
				scale={scale}
				accessibilityLabel="갸우뚱하는 돋보기, 눌러 보세요"
			>
				{/* 손잡이 */}
				<Path d="M90 92 L112 130" stroke={C.oak} strokeWidth="16" strokeLinecap="round" />
				<Path d="M90 92 L98 106" stroke={C.plum} strokeWidth="16" strokeLinecap="round" />
				{/* 렌즈 */}
				<Circle cx="58" cy="58" r="50" fill={C.white} stroke={C.plum} strokeWidth="9" />
				{/* 얼굴 */}
				<Circle cx="42" cy="54" r="5" fill={C.plum} />
				<Circle cx="74" cy="54" r="5" fill={C.plum} />
				<Path
					d="M44 78 Q52 72 60 78 T76 78"
					stroke={C.plum}
					strokeWidth="4.5"
					strokeLinecap="round"
					fill="none"
				/>
				<Path
					d="M36 40 Q42 36 48 38"
					stroke={C.plum}
					strokeWidth="3.5"
					strokeLinecap="round"
					fill="none"
				/>
				<Circle cx="30" cy="68" r="6" fill={C.lightPlum} fillOpacity={0.6} />
				<Circle cx="86" cy="68" r="6" fill={C.lightPlum} fillOpacity={0.6} />
			</Swingable>
		</View>
	);
}
