import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { FRAME_SWING, PLANT_SWING, Swingable } from '@/src/components/guide/Swingable';

interface ExitIllustrationProps {
	width?: number;
}

// 디자인 시스템 팔레트(Deep Plum·Blanket·Mushroom·Oak 등)로 그린 플랫 일러스트 — 전시장 벽의 액자와 벤치
const PLUM = '#5F1D3E';
const LIGHT_PLUM = '#E3A9C7';
const BLANKET = '#F2E0CF';
const MUSHROOM = '#D4C7B4';
const OAK = '#B48954';
const MOSS = '#7C7458';
const SKY = '#CAE4EF';
const PEACH = '#FFA873';
const INK = '#2D2D23';

/** 오디오 가이드 종료 화면의 장식 — 액자 세 점이 걸린 벽, 벤치 위의 헤드폰, 화분. 액자와 식물을 누르면 흔들린다 */
export function ExitIllustration({ width = 300 }: ExitIllustrationProps) {
	const scale = width / 320;
	const height = 220 * scale;

	return (
		<View style={{ width, height }}>
			<Svg
				width={width}
				height={height}
				viewBox="0 0 320 220"
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				{/* 바닥 */}
				<Rect x="0" y="186" width="320" height="2" rx="1" fill={MUSHROOM} />

				{/* 벤치 */}
				<Rect x="86" y="156" width="148" height="14" rx="5" fill={PLUM} />
				<Rect x="100" y="170" width="8" height="16" rx="2" fill={INK} />
				<Rect x="212" y="170" width="8" height="16" rx="2" fill={INK} />

				{/* 벤치 위 헤드폰 */}
				<Path
					d="M138 150 C138 128 182 128 182 150"
					stroke={INK}
					strokeWidth="5"
					strokeLinecap="round"
					fill="none"
				/>
				<Rect x="130" y="140" width="12" height="18" rx="5" fill={LIGHT_PLUM} />
				<Rect x="178" y="140" width="12" height="18" rx="5" fill={LIGHT_PLUM} />

				{/* 화분 */}
				<Path d="M276 186 L280 160 L304 160 L308 186 Z" fill={OAK} />
			</Svg>

			{/* 가운데 큰 액자 — 해 뜨는 풍경 */}
			<Swingable
				motion={FRAME_SWING}
				x={104}
				y={24}
				width={112}
				height={96}
				scale={scale}
				accessibilityLabel="해 뜨는 풍경 액자, 눌러 보세요"
			>
				<Rect x="0" y="0" width="112" height="96" rx="3" fill={PLUM} />
				<Rect x="8" y="8" width="96" height="80" rx="1" fill={BLANKET} />
				<Circle cx="56" cy="44" r="16" fill={PEACH} />
				<Path d="M8 88 L8 68 Q32 50 56 66 Q80 52 104 70 L104 88 Z" fill={MOSS} />
			</Swingable>

			{/* 왼쪽 작은 액자 — 하늘과 달 */}
			<Swingable
				motion={FRAME_SWING}
				x={34}
				y={52}
				width={52}
				height={68}
				scale={scale}
				accessibilityLabel="하늘과 달 액자, 눌러 보세요"
			>
				<Rect x="0" y="0" width="52" height="68" rx="3" fill={OAK} />
				<Rect x="6" y="6" width="40" height="56" rx="1" fill={SKY} />
				<Circle cx="26" cy="28" r="9" fill="#FFFFFF" />
				<Rect x="6" y="50" width="40" height="12" fill={MOSS} />
			</Swingable>

			{/* 오른쪽 작은 액자 — 추상 도형 */}
			<Swingable
				motion={FRAME_SWING}
				x={236}
				y={62}
				width={48}
				height={58}
				scale={scale}
				accessibilityLabel="추상 도형 액자, 눌러 보세요"
			>
				<Rect x="0" y="0" width="48" height="58" rx="3" fill={MUSHROOM} />
				<Rect x="6" y="6" width="36" height="46" rx="1" fill={LIGHT_PLUM} />
				<Circle cx="24" cy="22" r="8" fill={PLUM} />
				<Rect x="12" y="36" width="24" height="10" rx="2" fill={BLANKET} />
			</Swingable>

			{/* 화분 속 식물 — 눌러 보면 이리저리 흔들린다 */}
			<Swingable
				motion={PLANT_SWING}
				x={266}
				y={118}
				width={48}
				height={42}
				scale={scale}
				accessibilityLabel="화분 속 식물, 눌러 보세요"
			>
				<Path d="M26 42 C18 24 14 12 22 0 C28 10 30 22 26 42 Z" fill={MOSS} />
				<Path d="M26 42 C32 26 42 20 48 14 C46 28 38 38 26 42 Z" fill={MOSS} />
				<Path d="M26 42 C18 32 6 30 0 24 C4 36 14 42 26 42 Z" fill={MOSS} />
			</Swingable>
		</View>
	);
}
