import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { STATUS_LABELS } from '@/src/utils/exhibitionSearch';

interface PersonalizedRecommendationCardProps {
	item: RecommendableItem;
	width: number;
	onPress: (id: string) => void;
}

/** 추천 이유를 함께 읽을 수 있는 전용 페이지용 큐레이션 카드. */
export function PersonalizedRecommendationCard({
	item,
	width,
	onPress,
}: PersonalizedRecommendationCardProps) {
	const title = item.title.trim();
	const venue = item.venue.trim() || '장소 정보 없음';
	const posterWidth = Math.floor(width * 0.36);
	const posterHeight = Math.floor(posterWidth * 1.3);
	const reason = item.recommendationReason ?? '저장한 취향 장르와 맞는 전시예요.';

	return (
		<ScalePressable
			onPress={() => onPress(item.id)}
			accessibilityRole="button"
			accessibilityLabel={`${title}, ${venue}, ${STATUS_LABELS[item.status]}. ${reason}`}
		>
			<View className="flex-row gap-4 rounded-2xl border border-ink/10 bg-white p-4">
				<ImageFallback
					heroImageUri={item.thumbnail}
					className="rounded-xl bg-image-placeholder"
					style={{ width: posterWidth, height: posterHeight }}
					iconSize={34}
					resizeMode="cover"
					useImageProxy
				/>
				<View className="flex-1 justify-center">
					<View className="mb-2 self-start rounded-full bg-bg-tonal px-2 py-1">
						<Text className="font-pretendard-medium text-gray700 text-[10px]">
							취향에 맞는 전시
						</Text>
					</View>
					<Text
						numberOfLines={3}
						className="font-pretendard-semibold text-gray900 text-[16px] leading-[22px]"
						lineBreakStrategyIOS="hangul-word"
					>
						{title}
					</Text>
					<Text numberOfLines={1} className="mt-1 font-pretendard-regular text-gray600 text-[12px]">
						{`${venue} · ${STATUS_LABELS[item.status]}`}
					</Text>
					<View className="mt-3 flex-row items-start gap-1.5">
						<Ionicons name="sparkles-outline" size={14} className="mt-0.5 text-brand" />
						<Text className="flex-1 font-pretendard-regular text-gray700 text-[12px] leading-[18px]">
							{reason}
						</Text>
					</View>
				</View>
			</View>
		</ScalePressable>
	);
}
