import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { CaptionLabel } from '@/src/components/archive/CaptionLabel';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';
import { toCaptionDate, type FrameShape, type WallItem } from '@/src/utils/museumWall';

interface FrameCardProps {
	item: WallItem;
	/** 없으면 눌리지 않는 미리보기(기록 작성 화면)로 그린다 */
	onPress?: (visitKey: string) => void;
	/** 작은 미리보기 — 캡션을 생략하고 아래 여백을 줄인다 (기록 2단계) */
	compact?: boolean;
}

const SHAPE_CLASS_NAMES: Record<FrameShape, string> = {
	portrait: 'aspect-[3/4]',
	square: 'aspect-square',
	landscape: 'aspect-[4/3]',
};

/** 못에서 액자 위까지 줄이 늘어지는 높이 */
const WIRE_HEIGHT = 16;
/** 줄이 액자 윗변에 닿는 위치 — 폭 대비 비율(좌·우) */
const WIRE_ANCHORS = [0.2, 0.8] as const;
const NAIL_RADIUS = 2;

/** 벽에 걸린 액자 한 점 — 못과 삼각형 줄, 흰 매트 액자, 캡션. 이미지가 없으면 전시명 타이포 면으로 대체한다 */
export function FrameCard({ item, onPress, compact = false }: FrameCardProps) {
	const [hasImageError, setHasImageError] = useState(false);
	const [width, setWidth] = useState(0);

	const showImage = Boolean(item.imageUri) && !hasImageError;
	// 이미지 없는 면은 blanket과 중립 톤을 번갈아 — 기록마다 같은 면이 유지되도록 키 길이로 정한다
	const faceClassName = item.visitKey.length % 2 === 0 ? 'bg-blanket' : 'bg-surface-neutral';
	const ratingLabel = item.rating ? `, 별점 ${item.rating}점` : '';

	const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

	return (
		<Pressable
			onPress={onPress ? () => onPress(item.visitKey) : undefined}
			disabled={!onPress}
			accessibilityRole={onPress ? 'button' : 'image'}
			accessibilityLabel={`${item.title}, ${toCaptionDate(item.dateKey)}${ratingLabel}${onPress ? ', 기록 보기' : ', 미리보기'}`}
			style={({ pressed }) => ({ opacity: pressed && onPress ? 0.85 : 1 })}
			className={cn(compact ? 'mb-1' : 'mb-6')}
			onLayout={handleLayout}
		>
			{/* 장식이라 스크린리더에서 숨긴다 — 폭을 알기 전에는 그리지 않는다 */}
			<View
				importantForAccessibility="no-hide-descendants"
				accessibilityElementsHidden
				style={{ height: WIRE_HEIGHT }}
			>
				{width > 0 && (
					<Svg width={width} height={WIRE_HEIGHT}>
						{WIRE_ANCHORS.map((ratio) => (
							<Line
								key={ratio}
								x1={width / 2}
								y1={NAIL_RADIUS}
								x2={width * ratio}
								y2={WIRE_HEIGHT}
								stroke={colors.gray400}
								strokeWidth={1}
							/>
						))}
						<Circle cx={width / 2} cy={NAIL_RADIUS + 1} r={NAIL_RADIUS} fill={colors.gray400} />
					</Svg>
				)}
			</View>
			<View className="rounded-[2px] border-[0.5px] border-divider bg-white p-2">
				<View className={cn('w-full overflow-hidden', SHAPE_CLASS_NAMES[item.shape])}>
					{showImage ? (
						<Image
							source={{ uri: item.imageUri }}
							contentFit="cover"
							style={{ width: '100%', height: '100%' }}
							onError={() => setHasImageError(true)}
						/>
					) : (
						<View className={cn('flex-1 items-center justify-center px-3', faceClassName)}>
							<Text
								numberOfLines={4}
								className="text-center font-hahmlet-bold text-[15px] leading-[22px] text-ink"
							>
								{item.title}
							</Text>
						</View>
					)}
				</View>
			</View>
			{!compact && (
				<CaptionLabel
					title={item.title}
					venue={item.venue}
					dateLabel={toCaptionDate(item.dateKey)}
					memo={item.memo}
					className="mt-2"
				/>
			)}
		</Pressable>
	);
}
