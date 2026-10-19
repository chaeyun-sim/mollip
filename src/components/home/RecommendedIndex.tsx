import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { FadeInView } from '@/src/components/common/FadeInView';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { HOME_SIDE_PADDING, HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import { PersonalizedExhibitionCard } from '@/src/components/home/PersonalizedExhibitionCard';
import { getGridColumnWidth } from '@/src/utils/homeLayout';

const COLUMN_GAP = 14;
const PREVIEW_LIMIT = 2;

interface RecommendedIndexProps {
	title: string;
	items: RecommendableItem[];
	onPress: (id: string) => void;
	onSeeAll: () => void;
}

/** 취향 추천 — 홈에서는 두 점만 포스터 그리드로 미리 보여준다. */
export function RecommendedIndex({ title, items, onPress, onSeeAll }: RecommendedIndexProps) {
	const { width: windowWidth } = useWindowDimensions();
	const visible = items.slice(0, PREVIEW_LIMIT);
	const columnWidth = getGridColumnWidth(windowWidth, HOME_SIDE_PADDING, COLUMN_GAP, 2);

	if (visible.length === 0) return null;

	return (
		<View style={{ marginTop: 28 }}>
			<HomeSectionHeader
				index={3}
				title="FOR YOU"
				right={
					items.length > PREVIEW_LIMIT && (
						<Pressable
							onPress={onSeeAll}
							accessibilityRole="button"
							accessibilityLabel="취향 추천 더 보기"
							className="flex-row items-center gap-1"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Text className="text-gray700 text-[12px] font-pretendard-medium">더 보기</Text>
							<Ionicons name="chevron-forward" size={14} className="text-gray700" />
						</Pressable>
					)
				}
			/>
			<View className="mb-4" style={{ paddingHorizontal: HOME_SIDE_PADDING }}>
				<Text className="font-hahmlet-semibold text-gray900 text-[20px] leading-[28px]">
					{title}
				</Text>
				<Text className="mt-1 font-pretendard-regular text-gray600 text-[12px]">
					좋아하는 장르를 바탕으로 골랐어요
				</Text>
			</View>
			<View className="flex-row" style={{ paddingHorizontal: HOME_SIDE_PADDING, gap: COLUMN_GAP }}>
				{visible.map((item, index) => (
					<FadeInView key={item.id} delay={index * 70}>
						<PersonalizedExhibitionCard item={item} width={columnWidth} onPress={onPress} />
					</FadeInView>
				))}
			</View>
		</View>
	);
}
