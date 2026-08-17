import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreHomeHero } from '@/src/components/explore/ExploreHomeHero';
import { KcisaSection } from '@/src/components/explore/KcisaSection';
import {
	ExploreSectionTitle,
	FeaturedExhibitionHero,
	RecommendedExhibitions,
} from '@/src/components/explore/ExploreHomeSections';
import { Screen } from '@/src/components/layout/Screen';
import {
	useExploreScreenData,
	type ExhibitionSummary,
} from '@/src/hooks/useExploreScreenData';
import { cn } from '@/src/lib/cn';

export default function ExploreScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const {
		cultureStatus,
		refetch,
		kcisaItems,
		kcisaStatus,
		kcisaRefetch,
		featured,
		kcisaCarousel,
		displayedRecommended,
		isPersonalized,
	} = useExploreScreenData();

	const carousel = resolveKcisaCarousel();

	const openExhibition = (id: string) => router.push(`/(explore)/${id}`);

	function resolveKcisaCarousel(): ExhibitionSummary[] {
		if (kcisaCarousel.length > 0) return kcisaCarousel;
		if (featured?.source === 'kcisa') return [];
		return kcisaItems;
	}

	function renderRecommendedContent() {
		if (cultureStatus === 'loading' && displayedRecommended.length === 0) {
			return (
				<View className='items-center justify-center py-16'>
					<ActivityIndicator color='#A8A29E' />
				</View>
			);
		}

		if (cultureStatus === 'error') {
			return (
				<View className='items-center justify-center py-16 gap-2'>
					<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
						전시 정보를 불러오지 못했어요
					</Text>
					<Pressable
						onPress={refetch}
						accessibilityLabel='추천 전시 다시 불러오기'
						accessibilityRole='button'
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					>
						<Text className='text-[#1C1917] text-[13px] font-pretendard-semibold'>
							다시 시도
						</Text>
					</Pressable>
				</View>
			);
		}

		if (displayedRecommended.length === 0) {
			return (
				<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
					추천할 전시가 없어요
				</Text>
			);
		}

		return (
			<RecommendedExhibitions
				items={displayedRecommended}
				onPress={openExhibition}
			/>
		);
	}

	return (
		<Screen variant='warm' className='bg-[#f4f4f1]'>
			<Screen.Header>
				<Screen.Header.Logo />
				<Screen.Header.Right>
					<Pressable
						onPress={() => router.push('/settings')}
						hitSlop={8}
						accessibilityRole='button'
						accessibilityLabel='마이페이지'
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name='person-outline' size={24} color='#1C1917' />
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 96, gap: 28 }}
			>
				<ExploreHomeHero />

				{featured && (
					<FeaturedExhibitionHero
						id={featured.id}
						title={featured.title}
						venue={featured.venue}
						thumbnail={featured.thumbnail}
						onPress={openExhibition}
					/>
				)}

				<KcisaSection
					kcisaStatus={kcisaStatus}
					kcisaItems={kcisaItems}
					carousel={carousel}
					featured={featured}
					onPress={openExhibition}
					onRefetch={kcisaRefetch}
				/>

				<View>
					{/* 레이블: 선호 데이터 있으면 "당신의 취향" (REQ-UI002-009, REQ-UI002-010) */}
					<ExploreSectionTitle
						eyebrow='FOR YOU'
						title={isPersonalized ? '추천 전시 · 당신의 취향' : '추천 전시'}
					/>
					{renderRecommendedContent()}
				</View>
			</ScrollView>

			{/* FAB: safe area 하단 인셋 반영 (홈 인디케이터 겹침 방지) */}
			<View
				className={cn('absolute right-6')}
				style={{
					bottom: Math.max(insets.bottom + 16, 24),
					shadowColor: '#1C1917',
					shadowOpacity: 0.28,
					shadowRadius: 14,
					shadowOffset: { width: 0, height: 6 },
					elevation: 8,
				}}
			>
				<Pressable
					onPress={() => router.push('/(guide)/create-description')}
					accessibilityLabel='작품 해설 만들기'
					accessibilityHint='카메라로 작품을 촬영하거나 직접 입력하여 AI 해설을 받을 수 있어요'
					accessibilityRole='button'
					className='h-[58px] w-[58px] items-center justify-center rounded-full bg-[#1C1917]'
					style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
				>
					<Ionicons name='camera' size={26} color='#F2EFE9' />
				</Pressable>
			</View>
		</Screen>
	);
}
