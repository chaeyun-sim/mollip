import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Dimensions,
	FlatList,
	Pressable,
	ScrollView,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { SectionTitle } from '@/src/components/common/SectionTitle';
import { FeaturedExhibitionHero } from '@/src/components/explore';
import { HorizontalSection } from '@/src/components/explore/HorizontalSection';
import { KcisaExhibitionCard } from '@/src/components/explore/KcisaExhibitionCard';
import { KcisaSection } from '@/src/components/explore/KcisaSection';
import { PopularExhibitionAvatar } from '@/src/components/explore/PopularExhibitionAvatar';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { colors } from '@/src/constants/colors';
import { useExploreScreenData, type ExhibitionSummary } from '@/src/hooks/useExploreScreenData';
import { FEATURED_TAGLINES, useFeaturedTrio } from '@/src/hooks/useFeaturedTrio';
import { usePopularExhibitions } from '@/src/hooks/usePopularExhibitions';
import { useAuthStore } from '@/src/store/authStore';

export default function ExploreScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: cardWidth } = useWindowDimensions();

	const {
		cultureStatus,
		refetch,
		kcisaItems,
		kcisaStatus,
		kcisaRefetch,
		featured,
		featuredCarousel,
		kcisaCarousel,
		displayedRecommended,
		isPersonalized,
	} = useExploreScreenData();
	// FeaturedCarousel에 이미 노출 중인 전시는 인기 섹션에서 제외해 중복 노출을 막는다
	const {
		items: popularItems,
		status: popularStatus,
		refetch: popularRefetch,
	} = usePopularExhibitions(featuredCarousel.map((item) => item.id));

	// 메인 캐러셀: 특별전 · 인기 · 곧 개봉 3장
	const { picks: featuredTrio } = useFeaturedTrio(popularItems);
	const featuredTrioIds = useMemo(() => new Set(featuredTrio.map((p) => p.id)), [featuredTrio]);
	const displayedPopularItems = useMemo(
		() => popularItems.filter((item) => !featuredTrioIds.has(item.id)),
		[popularItems, featuredTrioIds],
	);

	const carousel = resolveKcisaCarousel();
	const name = useAuthStore((s) => s.user?.user_metadata?.full_name);

	const featuredListRef = useRef<FlatList>(null);
	const [, setFeaturedIndex] = useState(0);

	const openExhibition = (id: string) => router.push(`/(explore)/${id}`);

	useEffect(() => {
		if (featuredTrio.length <= 1) return;

		const timer = setInterval(() => {
			setFeaturedIndex((prev) => {
				const next = (prev + 1) % featuredTrio.length;
				featuredListRef.current?.scrollToOffset({ offset: next * cardWidth, animated: true });
				return next;
			});
		}, 3500);

		return () => clearInterval(timer);
	}, [featuredTrio.length, cardWidth]);

	function resolveKcisaCarousel(): ExhibitionSummary[] {
		if (kcisaCarousel.length > 0) return kcisaCarousel;
		if (featured?.source === 'kcisa') return [];
		return kcisaItems;
	}

	return (
		<Screen variant="warm" className="px-0">
			<ScreenHeader className="items-end pb-3 px-6 bg-bg-light">
				<ScreenHeader.Left>
					<ScreenHeader.Logo />
				</ScreenHeader.Left>
				<ScreenHeader.Right className="-mr-12">
					<Pressable
						// onPress={() => router.push('/settings')}
						onPress={() => router.push('/onboarding')}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="마이페이지"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name="person-outline" size={24} className="text-gray900" />
					</Pressable>
				</ScreenHeader.Right>
			</ScreenHeader>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName='pb-10 gap-7 pt-4'
			>
				<FlatList
					ref={featuredListRef}
					data={featuredTrio.map((item) => ({
						id: item.id,
						title: FEATURED_TAGLINES[item.badge],
						exhibitionTitle: item.title,
						venue: item.venue,
						thumbnail: item.thumbnail,
						status: item.status,
					}))}
					keyExtractor={(item) => item.id}
					horizontal
					showsHorizontalScrollIndicator={false}
					snapToInterval={cardWidth}
					decelerationRate="fast"
					onMomentumScrollEnd={(e) => {
						setFeaturedIndex(Math.round(e.nativeEvent.contentOffset.x / cardWidth));
					}}
					renderItem={({ item, index }) => (
						<View
							style={{
								width: Dimensions.get('window').width - 40,
								marginLeft: index > 0 ? 40 : 20,
								marginRight: index === featuredTrio.length - 1 ? 20 : 0,
							}}
						>
							<FeaturedExhibitionHero {...item} onPress={openExhibition} />
						</View>
					)}
				/>

				<HorizontalSection
					items={displayedPopularItems.slice(0, 7)}
					status={popularStatus}
					onRefetch={popularRefetch}
					renderItem={(item) => (
						<PopularExhibitionAvatar key={item.id} item={item} onPress={openExhibition} />
					)}
					sectionName="인기 전시"
					placeholder="인기 전시가 없어요"
					contentContainerClassName="gap-0"
				/>

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
					<SectionTitle
						eyebrow="FOR YOU"
						title={
							isPersonalized && name ? (
								<Text className="text-gray900 text-[18px] leading-normal font-pretendard-semibold tracking-[-0.5px]">
									{`몰립이 엄선한\n${name}님에게 `}
									<Text className="text-[#B8623D] font-pretendard-bold">딱 맞는 전시를 추천</Text>
									해드릴게요!
								</Text>
							) : (
								'추천 전시'
							)
						}
					/>
					<HorizontalSection
						items={displayedRecommended}
						status={cultureStatus}
						onRefetch={refetch}
						renderItem={(item) => (
							<KcisaExhibitionCard key={item.id} item={item} onPress={openExhibition} />
						)}
						sectionName="추천 전시"
						placeholder="추천할 전시가 없어요"
					/>
				</View>
			</ScrollView>

			{/* FAB 영역 */}
			<View
				className="absolute right-6 items-end gap-3"
				style={{
					bottom: Math.max(insets.bottom, 16),
					shadowColor: colors.gray900,
					shadowOpacity: 0.28,
					shadowRadius: 14,
					shadowOffset: { width: 0, height: 6 },
					elevation: 8,
				}}
			>
				<LoginRequiredPressable
					onPress={() => router.push('/(guide)/create-description')}
					accessibilityRole="button"
					accessibilityLabel="작품 해설 만들기"
					accessibilityHint="카메라로 작품을 촬영하거나 직접 입력하여 AI 해설을 받을 수 있어요"
					className="h-[58px] w-[58px] items-center justify-center rounded-full bg-secondary"
					style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
				>
					<Ionicons name="camera" size={26} className="text-bg-tonal" />
				</LoginRequiredPressable>
			</View>
		</Screen>
	);
}
