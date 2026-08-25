import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Image, ImageBackground, LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { ImageFallback, QUESTION_MARK } from '@/src/components/common/ImageFallback';
import { StatusBadge } from '@/src/components/search/StatusBadge';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

export interface FeaturedExhibitionProps {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
	onPress: (id: string) => void;
}

export function FeaturedExhibitionHero({
	id,
	title,
	venue,
	thumbnail,
	status,
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
				className="rounded-2xl overflow-hidden w-full"
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
						className="h-[340px] justify-end"
						imageStyle={{ resizeMode: 'cover' }}
					>
						<LinearGradient
							colors={['transparent', 'rgba(12,10,9,0.55)', 'rgba(12,10,9,0.95)']}
							style={{ paddingHorizontal: 22, paddingBottom: 22, paddingTop: 80 }}
						>
							<Text
								className="text-white/85 text-[11px] font-pretendard-semibold mb-2"
								style={{ letterSpacing: 1.5 }}
							>
								COVER STORY
							</Text>
							<View className="h-[1px] bg-white/40 w-10 mb-3" />
							<Text
								className="text-white text-[32px] leading-[38px] mb-2 font-hahmlet-bold"
								numberOfLines={2}
							>
								{title}
							</Text>
							<Text
								className="text-white/75 text-[13px] mb-4 font-pretendard-regular"
								numberOfLines={1}
							>
								{venue} · {STATUS_LABELS[status]}
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
							{venue} · {STATUS_LABELS[status]}
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
	status: ExhibitionStatus;
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
			<View style={{ width: colWidth }}>
				<StatusBadge status={item.status} className="mt-3" />
				<Text className="mt-1 text-primary text-[13px] leading-[18px] font-pretendard-semibold">
					{item.title.trim()}
				</Text>
				<Text numberOfLines={1} className="text-muted text-[11px] mt-0.5 font-pretendard-regular">
					{item.venue.trim()}
				</Text>
			</View>
		</Pressable>
	);
}


interface ListRowProps {
	item: RecommendableItem;
	onPress: (id: string) => void;
	showDivider: boolean;
}
function ListRow({ item, onPress, showDivider }: ListRowProps) {
	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(item.id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`${item.title}, ${item.venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View
				className={cn(
					'flex-row items-center gap-3.5 py-3.5',
					showDivider && 'border-b border-divider',
				)}
			>
				<PosterFrame thumbnail={item.thumbnail} width={56} height={56} borderRadius={10} iconSize={24} />
				<View className="flex-1">
					<StatusBadge status={item.status} />
					<Text
						numberOfLines={1}
						className="mt-1 text-primary text-[15px] leading-[20px] font-pretendard-semibold"
					>
						{item.title.trim()}
					</Text>
					<Text numberOfLines={1} className="text-muted text-[12px] mt-0.5 font-pretendard-regular">
						{item.venue.trim()}
					</Text>
				</View>
			</View>
		</Pressable>
	);
}

/** 추천 전시: 리드 피처 1개 + 나머지 최대 4개는 넘버링된 인덱스 리스트 */
export function RecommendedExhibitions({ items, onPress }: RecommendedExhibitionsProps) {
	const [containerWidth, setContainerWidth] = useState(0);
	const handleLayout = (e: LayoutChangeEvent) => {
		const w = e.nativeEvent.layout.width;
		if (w > 0 && w !== containerWidth) setContainerWidth(w);
	};

	const [lead, ...rest] = items;
	const listItems = rest.slice(0, 4);

	if (!lead) return null;

	const leadHeight = containerWidth > 0 ? Math.round(containerWidth * 0.56) : 0;

	return (
		<View onLayout={handleLayout}>
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					onPress(lead.id);
				}}
				accessibilityRole="button"
				accessibilityLabel={`${lead.title}, ${lead.venue}`}
				style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
			>
				<View>
					<PosterFrame
						thumbnail={lead.thumbnail}
						width={containerWidth}
						height={leadHeight}
						borderRadius={22}
						iconSize={80}
					/>
					<View className="absolute top-3 left-3 rounded-full bg-primary/90 px-2.5 py-1">
						<Text className="text-white text-[10px] font-pretendard-bold">PICK</Text>
					</View>
				</View>
				<View className="mt-3">
					<StatusBadge status={lead.status} />
				</View>
				<Text
					numberOfLines={2}
					className="mt-1 text-primary text-[16px] leading-[22px] font-pretendard-semibold"
				>
					{lead.title.trim()}
				</Text>
				<Text numberOfLines={1} className="text-muted text-[12px] mt-1 font-pretendard-regular">
					{lead.venue.trim()}
				</Text>
			</Pressable>

			{listItems.length > 0 && (
				<View className="mt-3">
					{listItems.map((item, i) => (
						<ListRow
							key={item.id}
							item={item}
							onPress={onPress}
							showDivider={i < listItems.length - 1}
						/>
					))}
				</View>
			)}
		</View>
	);
}
