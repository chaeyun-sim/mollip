import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { HOME_SIDE_PADDING, HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import { PersonalizedRecommendationCard } from '@/src/components/home/PersonalizedRecommendationCard';

const PREVIEW_LIMIT = 4;

interface RecommendedIndexProps {
	title: string;
	items: RecommendableItem[];
	preferredGenres: string[];
	onPress: (id: string) => void;
	isLoading: boolean;
	isError: boolean;
	hasPreferences: boolean;
}

/** 취향 추천 — 홈 스크롤 안에서 최대 네 점을 보여준다. */
export function RecommendedIndex({
	title,
	items,
	preferredGenres,
	onPress,
	isLoading,
	isError,
	hasPreferences,
}: RecommendedIndexProps) {
	const { t } = useTranslation();

	const visible = items.slice(0, PREVIEW_LIMIT);
	const preferenceDescription =
		preferredGenres.length > 0
			? t('recommendations.picked_from_genres', {
					genres: preferredGenres
						.map((genre) => t(`recommendations.labels.${genre}`, { defaultValue: genre }))
						.join(' · '),
				})
			: t('recommendations.picked_from_saved');
	let emptyMessage = t('recommendations.no_preferences');
	if (hasPreferences) emptyMessage = t('recommendations.no_matching');
	if (isError) emptyMessage = t('recommendations.load_error');
	if (isLoading) emptyMessage = t('recommendations.finding');

	return (
		<View className="mt-7">
			<HomeSectionHeader
				index={3}
				title="FOR YOU"
				right={<Ionicons name="heart" size={14} className="text-gray700" />}
			/>
			<View className="mb-4" style={{ paddingHorizontal: HOME_SIDE_PADDING }}>
				<Text className="font-pretendard-semibold text-gray900 text-[20px] leading-[28px]">
					{title}
				</Text>
				<Text className="mt-1 font-pretendard-regular text-gray600 text-[12px]">
					{preferenceDescription}
				</Text>
			</View>
			<View className="gap-4 px-6">
				{visible.map((item) => (
					<PersonalizedRecommendationCard key={item.id} item={item} onPress={onPress} />
				))}
				{visible.length === 0 && (
					<Text className="font-pretendard-regular text-[13px] text-gray600">{emptyMessage}</Text>
				)}
			</View>
		</View>
	);
}
