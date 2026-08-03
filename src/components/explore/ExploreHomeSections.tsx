import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
	Image,
	ImageBackground,
	LayoutChangeEvent,
	Pressable,
	Text,
	View,
} from 'react-native';

import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import type { CultureExhibitionItem } from '@/src/hooks/useCultureExhibitions';

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
			accessibilityRole='button'
			accessibilityLabel={`오늘의 전시, ${title}, ${venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
		>
			<View
				className='rounded-[28px] overflow-hidden'
				style={{
					shadowColor: '#1C1917',
					shadowOpacity: 0.14,
					shadowRadius: 20,
					shadowOffset: { width: 0, height: 10 },
					elevation: 8,
				}}
			>
				{thumbnail ? (
					<ImageBackground
						source={{ uri: thumbnail }}
						style={{ height: 300, justifyContent: 'flex-end' }}
						imageStyle={{ resizeMode: 'cover' }}
					>
						<LinearGradient
							colors={['transparent', 'rgba(12,10,9,0.55)', 'rgba(12,10,9,0.92)']}
							style={{ paddingHorizontal: 22, paddingBottom: 22, paddingTop: 80 }}
						>
							<Text
								className='text-[11px] text-white/80 mb-2'
								style={{ fontFamily: 'Pretendard-SemiBold', letterSpacing: 1.8 }}
							>
								오늘의 전시
							</Text>
							<Text
								className='text-white text-[26px] leading-[32px] mb-2'
								style={{ fontFamily: 'Hahmlet_700Bold' }}
								numberOfLines={2}
							>
								{title}
							</Text>
							<Text
								className='text-white/75 text-[13px] mb-4'
								style={{ fontFamily: 'Pretendard-Regular' }}
								numberOfLines={1}
							>
								{venue}
							</Text>
							<View className='flex-row items-center gap-1.5 self-start rounded-full bg-white/95 px-4 py-2'>
								<Text
									className='text-[#1C1917] text-[13px]'
									style={{ fontFamily: 'Pretendard-SemiBold' }}
								>
									자세히 보기
								</Text>
								<Ionicons name='arrow-forward' size={14} color='#1C1917' />
							</View>
						</LinearGradient>
					</ImageBackground>
				) : (
					<View className='h-[300px] bg-[#E5E1D8] items-center justify-center px-6'>
						<EmptyImagePlaceholder iconSize={100} className='mb-4' />
						<Text
							className='text-[#1C1917] text-[22px] text-center'
							style={{ fontFamily: 'Hahmlet_700Bold' }}
							numberOfLines={2}
						>
							{title}
						</Text>
						<Text
							className='text-[#78716C] text-[13px] mt-2 text-center'
							style={{ fontFamily: 'Pretendard-Regular' }}
						>
							{venue}
						</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}

interface SectionTitleProps {
	eyebrow: string;
	title: string;
}

export function ExploreSectionTitle({ eyebrow, title }: SectionTitleProps) {
	return (
		<View className='mb-4'>
			<Text
				className='text-[11px] text-[#A8A29E] mb-1'
				style={{ fontFamily: 'Pretendard-SemiBold', letterSpacing: 1.6 }}
			>
				{eyebrow}
			</Text>
			<Text className='text-[#1C1917] text-[20px]' style={{ fontFamily: 'Hahmlet_600SemiBold' }}>
				{title}
			</Text>
		</View>
	);
}

interface RecommendedExhibitionsProps {
	items: CultureExhibitionItem[];
	onPress: (id: string) => void;
}

function PosterFrame({
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
	const sizeStyle = { width, height };

	return (
		<View
			className='overflow-hidden'
			style={{
				...sizeStyle,
				borderRadius,
				shadowColor: '#1C1917',
				shadowOpacity: 0.08,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 3 },
			}}
		>
			{thumbnail ? (
				<Image
					source={{ uri: thumbnail }}
					style={{ ...sizeStyle, borderRadius }}
					resizeMode='cover'
				/>
			) : (
				<EmptyImagePlaceholder
					className='items-center justify-center bg-[#E5E1D8]'
					style={{ ...sizeStyle, borderRadius }}
					iconSize={iconSize}
				/>
			)}
		</View>
	);
}

function GridExhibitionCell({
	item,
	colWidth,
	gridHeight,
	onPress,
}: {
	item: CultureExhibitionItem;
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
			accessibilityRole='button'
			accessibilityLabel={`${item.title}, ${item.venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, width: colWidth })}
		>
			<PosterFrame
				thumbnail={item.thumbnail}
				width={colWidth}
				height={gridHeight}
				borderRadius={16}
				iconSize={40}
			/>
			<View className='flex-1'>
				<Text
				className='mt-2 text-[#1C1917] text-[13px] leading-[18px]'
				style={{ fontFamily: 'Pretendard-SemiBold', width: colWidth }}
			>
				{item.title}
			</Text>
			<Text
				numberOfLines={1}
				className='text-[#A8A29E] text-[11px] mt-0.5'
				style={{ fontFamily: 'Pretendard-Regular' }}
			>
				{item.venue}
			</Text>
			</View>
		</Pressable>
	);
}

function pairGridRows(items: CultureExhibitionItem[]): CultureExhibitionItem[][] {
	const rows: CultureExhibitionItem[][] = [];
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
		<View style={{ gap: 16 }} onLayout={handleLayout}>
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					onPress(lead.id);
				}}
				accessibilityRole='button'
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
					className='mt-3 text-[#1C1917] text-[16px] leading-[22px]'
					style={{ fontFamily: 'Pretendard-SemiBold' }}
				>
					{lead.title}
				</Text>
				<Text
					numberOfLines={1}
					className='text-[#A8A29E] text-[12px] mt-1'
					style={{ fontFamily: 'Pretendard-Regular' }}
				>
					{lead.venue}
				</Text>
			</Pressable>

			{gridRows.length > 0 ? (
				<View style={{ gap: GRID_GAP + 8 }}>
					{gridRows.map((row, rowIndex) => (
						<View
							key={`row-${rowIndex}`}
							style={{
								flexDirection: 'row',
								gap: GRID_GAP,
								alignItems: 'flex-start',
							}}
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
