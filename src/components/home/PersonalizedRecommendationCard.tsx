import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';

interface PersonalizedRecommendationCardProps {
	item: RecommendableItem;
	onPress: (id: string) => void;
}

/** 홈에서 전시 정보와 추천 이유를 함께 보여주는 작은 카드. */
export function PersonalizedRecommendationCard({
	item,
	onPress,
}: PersonalizedRecommendationCardProps) {
	const { t } = useTranslation();

	const title = item.title.trim();
	const venue = item.venue.trim() || t('common.no_venue_info');
	const tags = (item.recommendationTags ?? []).map((tag) =>
		t(`recommendations.labels.${tag}`, { defaultValue: tag }),
	);

	return (
		<ScalePressable
			className="w-full"
			onPress={() => onPress(item.id)}
			accessibilityRole="button"
			accessibilityLabel={`${title}, ${venue}${tags.length > 0 ? t('recommendations.taste_tags_a11y', { tags: tags.join(', ') }) : ''}`}
		>
			<View className="w-full flex-row gap-3 rounded-2xl border border-ink/10 bg-white p-3">
				<ImageFallback
					heroImageUri={item.thumbnail}
					className="h-[116px] w-[88px] rounded-xl bg-image-placeholder"
					iconSize={32}
					resizeMode="cover"
					useImageProxy
				/>
				<View className="flex-1 justify-between py-0.5">
					<View>
						<Text
							numberOfLines={2}
							className="font-pretendard-semibold text-[15px] leading-[20px] text-gray900"
							lineBreakStrategyIOS="hangul-word"
						>
							{title}
						</Text>
						<Text
							numberOfLines={1}
							className="mt-1 font-pretendard-regular text-[12px] text-gray600"
						>
							{venue}
						</Text>
					</View>
					{tags.length > 0 && (
						<View className="mt-2 flex-row items-start gap-1.5 border-t border-ink/10 pt-2">
							<Ionicons name="sparkles-outline" size={13} className="mt-0.5 text-brand" />
							<Text className="flex-1 font-pretendard-medium text-[11px] leading-[16px] text-gray700">
								{tags.join(', ')}
							</Text>
						</View>
					)}
				</View>
			</View>
		</ScalePressable>
	);
}
