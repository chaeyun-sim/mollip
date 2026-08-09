import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';

import { ExploreHomeHero } from '@/src/components/explore/ExploreHomeHero';
import { KcisaExhibitionCard } from '@/src/components/explore/KcisaExhibitionCard';
import {
	ExploreSectionTitle,
	FeaturedExhibitionHero,
	RecommendedExhibitions,
} from '@/src/components/explore/ExploreHomeSections';
import { Screen } from '@/src/components/layout/Screen';
import { useCultureExhibitions } from '@/src/hooks/useCultureExhibitions';
import { useKcisaExhibitions } from '@/src/hooks/useKcisaExhibitions';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useRecommendedExhibitions } from '@/src/hooks/useRecommendedExhibitions';
import { useAuthStore } from '@/src/store/authStore';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useVisitStore } from '@/src/store/visitStore';

export default function ExploreScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const { items, status, refetch } = useCultureExhibitions();
	const {
		items: kcisaItems,
		status: kcisaStatus,
		refetch: kcisaRefetch,
	} = useKcisaExhibitions();

	// 사용자 선호 데이터 (REQ-UI002-005)
	const { preferredGenres, preferredArtists } = usePreferences(userId);

	const visits = useVisitStore((s) => s.visits);
	const visitedIds = useMemo(
		() =>
			Object.values(visits)
				.map((v) => v.exhibitionId)
				.filter((id): id is string => id !== null),
		[visits],
	);
	const bookmarkedIds = useBookmarkStore((s) => s.ids);

	const openExhibition = (id: string) => router.push(`/(explore)/${id}`);

	const featured = useMemo(() => {
		if (kcisaItems.length > 0) {
			const f = kcisaItems[0];
			return {
				source: 'kcisa' as const,
				id: f.id,
				title: f.title,
				venue: f.venue,
				thumbnail: f.thumbnail,
			};
		}
		if (items.length > 0) {
			const f = items[0];
			return {
				source: 'culture' as const,
				id: f.id,
				title: f.title,
				venue: f.venue,
				thumbnail: f.thumbnail,
			};
		}
		return null;
	}, [kcisaItems, items]);

	const kcisaCarousel = useMemo(() => {
		if (!featured || featured.source !== 'kcisa') return kcisaItems;
		return kcisaItems.slice(1);
	}, [kcisaItems, featured]);

	const cultureList = useMemo(() => {
		if (!featured || featured.source !== 'culture') return items;
		return items.slice(1);
	}, [items, featured]);

	// 취향 기반 추천 (REQ-UI002-002, REQ-UI002-008, REQ-UI002-011)
	const { items: recommendedItems, isPersonalized } = useRecommendedExhibitions(
		preferredGenres,
		preferredArtists,
		visitedIds,
		bookmarkedIds,
	);

	// 추천 훅이 아직 데이터를 불러오지 못한 경우 기존 목록으로 fallback
	const displayedRecommended = useMemo(() => {
		if (recommendedItems.length > 0) return recommendedItems;
		const culturePart = cultureList.slice(0, 5);
		if (culturePart.length >= 5) return culturePart;
		return [...culturePart, ...kcisaCarousel.slice(0, 5 - culturePart.length)];
	}, [recommendedItems, cultureList, kcisaCarousel]);

	return (
		<Screen variant='warm' className='bg-[#f4f4f1]'>
			<Screen.Header>
				<Screen.Header.Logo />
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 96, gap: 28 }}
			>
				<ExploreHomeHero />

				{featured ? (
					<FeaturedExhibitionHero
						id={featured.id}
						title={featured.title}
						venue={featured.venue}
						thumbnail={featured.thumbnail}
						onPress={openExhibition}
					/>
				) : null}

				{(() => {
					const carousel =
						kcisaCarousel.length > 0
							? kcisaCarousel
							: featured?.source === 'kcisa'
								? []
								: kcisaItems;
					const showKcisaSection =
						kcisaStatus === 'loading' ||
						kcisaStatus === 'error' ||
						carousel.length > 0 ||
						(kcisaItems.length === 0 && kcisaStatus === 'success');

					if (!showKcisaSection && featured?.source === 'kcisa') return null;

					return (
						<View>
							<ExploreSectionTitle eyebrow='PUBLIC MUSEUMS' title='국공립 기관 전시' />
							{kcisaStatus === 'loading' && kcisaItems.length === 0 ? (
								<View className='items-center justify-center py-8'>
									<ActivityIndicator color='#A8A29E' />
								</View>
							) : kcisaStatus === 'error' ? (
								<View className='items-center justify-center py-8 gap-2'>
									<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
										전시 정보를 불러오지 못했어요
									</Text>
									<Pressable
										onPress={kcisaRefetch}
										accessibilityLabel='다시 시도'
										accessibilityRole='button'
									>
										<Text className='text-[#1C1917] text-[13px] font-pretendard-semibold'>
											다시 시도
										</Text>
									</Pressable>
								</View>
							) : carousel.length === 0 ? (
								<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
									진행 중인 전시가 없어요
								</Text>
							) : (
								<View className='-mx-6'>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={{
											flexDirection: 'row',
											gap: 14,
											paddingHorizontal: 24,
											paddingVertical: 4,
										}}
									>
										{carousel.map((item) => (
											<KcisaExhibitionCard
												key={item.id}
												item={item}
												onPress={openExhibition}
											/>
										))}
									</ScrollView>
								</View>
							)}
						</View>
					);
				})()}

				<View>
					{/* 레이블: 선호 데이터 있으면 "당신의 취향" (REQ-UI002-009, REQ-UI002-010) */}
					<ExploreSectionTitle
						eyebrow='FOR YOU'
						title={isPersonalized ? '추천 전시 · 당신의 취향' : '추천 전시'}
					/>
					{status === 'loading' && items.length === 0 ? (
						<View className='items-center justify-center py-16'>
							<ActivityIndicator color='#A8A29E' />
						</View>
					) : status === 'error' ? (
						<View className='items-center justify-center py-16 gap-2'>
							<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
								전시 정보를 불러오지 못했어요
							</Text>
							<Pressable
								onPress={refetch}
								accessibilityLabel='다시 시도'
								accessibilityRole='button'
							>
								<Text className='text-[#1C1917] text-[13px] font-pretendard-semibold'>
									다시 시도
								</Text>
							</Pressable>
						</View>
					) : displayedRecommended.length === 0 ? (
						<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
							추천할 전시가 없어요
						</Text>
					) : (
						<RecommendedExhibitions
							items={displayedRecommended}
							onPress={openExhibition}
						/>
					)}
				</View>
			</ScrollView>

			<Pressable
				onPress={() => router.push('/(guide)/create-description')}
				accessibilityLabel='작품 해설 만들기'
				accessibilityRole='button'
				className='absolute bottom-6 right-6 h-[58px] w-[58px] items-center justify-center rounded-full bg-[#1C1917]'
				style={({ pressed }) => ({
					opacity: pressed ? 0.88 : 1,
					shadowColor: '#1C1917',
					shadowOpacity: 0.28,
					shadowRadius: 14,
					shadowOffset: { width: 0, height: 6 },
					elevation: 8,
				})}
			>
				<Ionicons name='camera' size={26} color='#F2EFE9' />
			</Pressable>
		</Screen>
	);
}
