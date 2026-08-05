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
	type RecommendableItem,
} from '@/src/components/explore/ExploreHomeSections';
import { Screen } from '@/src/components/layout/Screen';
import { useCultureExhibitions } from '@/src/hooks/useCultureExhibitions';
import { useKcisaExhibitions } from '@/src/hooks/useKcisaExhibitions';

/** 추천 전시: 1장 hero + 그리드 4장 */
const RECOMMENDED_TOTAL = 5;

export default function ExploreScreen() {
	const router = useRouter();
	const { items, status, refetch } = useCultureExhibitions();
	const {
		items: kcisaItems,
		status: kcisaStatus,
		refetch: kcisaRefetch,
	} = useKcisaExhibitions();

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

	const recommendedItems = useMemo((): RecommendableItem[] => {
		const culturePart = cultureList.slice(0, RECOMMENDED_TOTAL);
		if (culturePart.length >= RECOMMENDED_TOTAL) return culturePart;
		// culture가 부족하면 kcisa 캐러셀 항목으로 채움
		const kcisaPart = kcisaCarousel.slice(
			0,
			RECOMMENDED_TOTAL - culturePart.length,
		);
		return [...culturePart, ...kcisaPart];
	}, [cultureList, kcisaCarousel]);

	return (
		<Screen variant='warm' className='bg-[#F8F6F2]'>
			<Screen.Header>
				<Screen.Header.Logo />
				<Screen.Header.Right>
					<Pressable
						onPress={() => router.push('/settings')}
						hitSlop={12}
						accessibilityLabel='설정'
						accessibilityRole='button'
						className='h-10 w-10 items-center justify-center rounded-full bg-white/80'
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons name='settings-outline' size={20} color='#57534E' />
					</Pressable>
				</Screen.Header.Right>
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
					<ExploreSectionTitle eyebrow='FOR YOU' title='추천 전시' />
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
					) : recommendedItems.length === 0 ? (
						<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
							추천할 전시가 없어요
						</Text>
					) : (
						<RecommendedExhibitions
							items={recommendedItems}
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
