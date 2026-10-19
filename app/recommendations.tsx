import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { PersonalizedRecommendationCard } from '@/src/components/home/PersonalizedRecommendationCard';
import { RecommendationsEmptyState } from '@/src/components/home/RecommendationsEmptyState';
import { Screen } from '@/src/components/layout/Screen';
import { useRecommendedExhibitions } from '@/src/hooks/queries/useRecommendedExhibitions';
import { usePreferences } from '@/src/hooks/queries/usePreferences';
import { useAuthStore } from '@/src/store/authStore';

const PAGE_PADDING = 24;

export default function RecommendationsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const userId = useAuthStore((state) => state.user?.id);
	const { preferredGenres, isLoading: preferencesLoading } = usePreferences(userId);
	const { data, isLoading, isError, refetch } = useRecommendedExhibitions(
		preferredGenres,
		preferredGenres.length > 0,
	);
	const cardWidth = windowWidth - PAGE_PADDING * 2;

	const openExhibition = useCallback((id: string) => router.push(`/(explore)/${id}`), [router]);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back />
				</Screen.Header.Left>
				<Screen.Header.Center>취향 추천</Screen.Header.Center>
				<Screen.Header.Right>
					<Ionicons name="heart-outline" size={20} className="text-gray700" />
				</Screen.Header.Right>
			</Screen.Header>

			<View className="mb-5">
				<Text className="font-pretendard-regular text-[13px] leading-[19px] text-gray600">
					좋아하는 장르를 바탕으로 골랐어요
				</Text>
				{preferredGenres.length > 0 && (
					<Text className="mt-1 font-pretendard-medium text-[12px] text-gray700">
						{preferredGenres.join(' · ')}
					</Text>
				)}
			</View>

			<FlatList
				data={data}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{
					flexGrow: 1,
					gap: 16,
					paddingHorizontal: PAGE_PADDING,
					paddingBottom: insets.bottom + 24,
				}}
				renderItem={({ item }) => (
					<PersonalizedRecommendationCard item={item} width={cardWidth} onPress={openExhibition} />
				)}
				ListEmptyComponent={
					<RecommendationsEmptyState
						isLoading={preferencesLoading || isLoading}
						isError={isError}
						hasPreferredGenres={preferredGenres.length > 0}
						cardWidth={cardWidth}
						onRetry={() => void refetch()}
					/>
				}
				showsVerticalScrollIndicator={false}
			/>
		</Screen>
	);
}
