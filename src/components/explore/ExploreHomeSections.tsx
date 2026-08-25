import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Image, ImageBackground, LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { ImageFallback, QUESTION_MARK } from '@/src/components/common/ImageFallback';
import { colors } from '@/src/constants/colors';

const GRID_GAP = 12;

export interface FeaturedExhibitionProps {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	onPress: (id: string) => void;
}

export function FeaturedExhibitionHero({
	id,
	title,
	venue,
	thumbnail,
	onPress,
}: FeaturedExhibitionProps) {
	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`오늘의 전시, ${title}, ${venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
		>
			<View
				className="rounded-[28px] overflow-hidden w-full"
				style={{
					shadowColor: colors.primary,
					shadowOpacity: 0.14,
					shadowRadius: 20,
					shadowOffset: { width: 0, height: 10 },
					elevation: 8,
				}}
			>
				{thumbnail ? (
					<ImageBackground
						source={{ uri: thumbnail }}
						className="h-[300px] justify-end"
						imageStyle={{ resizeMode: 'cover' }}
					>
						<LinearGradient
							colors={['transparent', 'rgba(12,10,9,0.55)', 'rgba(12,10,9,0.92)']}
							style={{ paddingHorizontal: 22, paddingBottom: 22, paddingTop: 80 }}
						>
							<Text className="text-[11px] text-white/80 mb-2 font-pretendard-semibold leading-[1.8px]">
								오늘의 전시
							</Text>
							<Text
								className="text-white text-[26px] leading-[32px] mb-2 font-hahmlet-bold"
								numberOfLines={2}
							>
								{title}
							</Text>
							<Text
								className="text-white/75 text-[13px] mb-4 font-pretendard-regular"
								numberOfLines={1}
							>
								{venue}
							</Text>
							<View className="flex-row items-center gap-1.5 self-start rounded-full bg-white/95 px-4 py-2">
								<Text className="text-primary text-[13px] font-pretendard-semibold">
									자세히 보기
								</Text>
								<Ionicons name="arrow-forward" size={14} className="text-primary" />
							</View>
						</LinearGradient>
					</ImageBackground>
				) : (
					<View className="h-[300px] bg-image-placeholder items-center justify-center px-6">
						<Image
							source={QUESTION_MARK}
							style={{ width: 100, height: 100 }}
							resizeMode="contain"
							className="mb-4"
						/>
						<Text
							className="text-primary text-[22px] text-center font-hahmlet-bold"
							numberOfLines={2}
						>
							{title}
						</Text>
						<Text className="text-tertiary text-[13px] mt-2 text-center font-pretendard-regular">
							{venue}
						</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}

export interface RecommendableItem {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
}

interface RecommendedExhibitionsProps {
	items: RecommendableItem[];
	onPress: (id: string) => void;
}

export function PosterFrame({
	thumbnail,
	width,
	height,
	borderRadius = 18,
	iconSize = 48,
}: {
	thumbnail: string | null | undefined;
	width: number;
	height: number;
	borderRadius?: number;
	iconSize?: number;
}) {
	return (
		<View
			style={{
				width,
				height,
				borderRadius,
				shadowColor: colors.primary,
				shadowOpacity: 0.08,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 3 },
			}}
		>
			<ImageFallback
				heroImageUri={thumbnail}
				className="bg-image-placeholder"
				style={{ width, height, borderRadius, overflow: 'hidden' }}
				iconSize={iconSize}
				resizeMode="cover"
				useImageProxy
				loadingIndicatorColor={colors.muted}
			/>
		</View>
	);
}

export function GridExhibitionCell({
	item,
	colWidth,
	gridHeight,
	onPress,
}: {
	item: RecommendableItem;
	colWidth: number;
	gridHeight: number;
	onPress: (id: string) => void;
}) {
	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(item.id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`${item.title}, ${item.venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, width: '100%' })}
		>
			<PosterFrame
				thumbnail={item.thumbnail}
				width={colWidth}
				height={gridHeight}
				borderRadius={16}
				iconSize={40}
			/>
			<View>
				<Text
					className="mt-2 text-primary text-[13px] leading-[18px] font-pretendard-semibold"
					style={{ width: colWidth }}
				>
					{item.title.trim()}
				</Text>
				<Text
					numberOfLines={1}
					className="text-muted text-[11px] mt-0.5 font-pretendard-regular"
					style={{ width: colWidth }}
				>
					{item.venue.trim()}
				</Text>
			</View>
		</Pressable>
	);
}

function pairGridRows(items: RecommendableItem[]): RecommendableItem[][] {
	const rows: RecommendableItem[][] = [];
	for (let i = 0; i < items.length; i += 2) {
		rows.push(items.slice(i, i + 2));
	}
	return rows;
}

/** 추천 전시: 1장 full-width + 나머지 최대 4장 2열 그리드 */
export function RecommendedExhibitions({ items, onPress }: RecommendedExhibitionsProps) {
	const [containerWidth, setContainerWidth] = useState(0);
	const handleLayout = (e: LayoutChangeEvent) => {
		const w = e.nativeEvent.layout.width;
		if (w > 0 && w !== containerWidth) setContainerWidth(w);
	};

	const [lead, ...rest] = items;
	const gridItems = rest.slice(0, 4);
	const gridRows = pairGridRows(gridItems);

	if (!lead) return null;

	const colWidth = containerWidth > 0 ? (containerWidth - GRID_GAP) / 2 : 0;
	const gridHeight = Math.round((colWidth * 4) / 3);
	const leadHeight = containerWidth > 0 ? Math.round(containerWidth * 0.56) : 0;

	return (
		<View className="gap-4" onLayout={handleLayout}>
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					onPress(lead.id);
				}}
				accessibilityRole="button"
				accessibilityLabel={`${lead.title}, ${lead.venue}`}
				style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
			>
				<PosterFrame
					thumbnail={lead.thumbnail}
					width={containerWidth}
					height={leadHeight}
					borderRadius={22}
					iconSize={80}
				/>
				<Text
					numberOfLines={2}
					className="mt-3 text-primary text-[16px] leading-[22px] font-pretendard-semibold"
				>
					{lead.title.trim()}
				</Text>
				<Text numberOfLines={1} className="text-muted text-[12px] mt-1 font-pretendard-regular">
					{lead.venue.trim()}
				</Text>
			</Pressable>

			{gridRows.length > 0 ? (
				<View style={{ gap: GRID_GAP + 8 }}>
					{gridRows.map((row, rowIndex) => (
						<View
							key={`row-${rowIndex}`}
							className="flex-row items-start"
							style={{ gap: GRID_GAP + 8 }}
						>
							{row.map((item) => (
								<GridExhibitionCell
									key={item.id}
									item={item}
									colWidth={colWidth}
									gridHeight={gridHeight}
									onPress={onPress}
								/>
							))}
							{row.length === 1 ? <View style={{ width: colWidth }} /> : null}
						</View>
					))}
				</View>
			) : null}
		</View>
	);
}
