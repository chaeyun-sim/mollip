import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	FlatList,
	Pressable,
	ScrollView,
	Text,
	useWindowDimensions,
	View,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { IconButton } from '@/src/components/common/IconButton';
import { SearchBar } from '@/src/components/common/SearchBar';
import { FeaturedExhibitionHero } from '@/src/components/explore';
import type { FeaturedExhibitionProps } from '@/src/components/explore/FeaturedExhibitionHero';
import { ClosingSoonRail } from '@/src/components/home/ClosingSoonRail';
import { DailyArtworkBand } from '@/src/components/home/DailyArtworkBand';
import { RecommendedGrid } from '@/src/components/home/RecommendedGrid';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { useMarkInteractive } from '@/src/hooks/useMarkInteractive';
import { useDailyArtwork } from '@/src/hooks/queries/useDailyArtwork';
import { usePopularExhibitions } from '@/src/hooks/queries/usePopularExhibitions';
import { useExploreScreenData } from '@/src/hooks/queries/useExploreScreenData';
import { FEATURED_TAGLINES, useFeaturedTrio } from '@/src/hooks/queries/useFeaturedTrio';
import { useSubscription } from '@/src/hooks/useSubscription';
import { updateStore } from '@/src/store';
import { useAuthStore } from '@/src/store/authStore';
import { toAsyncStatus } from '@/src/types/asyncStatus.types';
import { cn } from '@/src/lib/cn';
import { getFeaturedPageIndex, getFeaturedPageMetrics } from '@/src/utils/featuredPaging';
import {
	CLOSING_SOON_DAYS,
	CLOSING_SOON_MIN_DAYS,
	pickClosingSoon,
} from '@/src/utils/homeExhibitionMeta';

const FEATURED_SIDE_PADDING = 24;
const FEATURED_GAP = 12;
type FeaturedItem = Pick<
	FeaturedExhibitionProps,
	'id' | 'tagline' | 'exhibitionTitle' | 'venue' | 'thumbnail' | 'status'
>;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function ExploreScreen() {
	useMarkInteractive();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();

	const name = useAuthStore((s) => s.user?.user_metadata?.full_name);
	const { isPremium, isLoading: isSubscriptionLoading } = useSubscription();

	const { kcisaQuery, cultureQuery, featuredCarousel, displayedRecommended, isPersonalized } =
		useExploreScreenData();

	// 인기 데이터는 캐러셀의 '인기 전시' 자리를 고르는 데만 쓴다
	const { data: popularItems = [], isLoading: popularLoading } = usePopularExhibitions(
		featuredCarousel.map((item) => item.id),
	);

	// 메인 캐러셀: 특별전 · 인기 · 곧 개봉 3장
	const { picks: featuredTrio, isLoading: featuredLoading } = useFeaturedTrio(popularItems);
	const {
		artwork: dailyArtwork,
		imageUrl: dailyArtworkImageUrl,
		isImageLoading: isDailyArtworkLoading,
		markListened: markDailyArtworkListened,
	} = useDailyArtwork();
	const [featuredIndex, setFeaturedIndex] = useState(0);
	const featuredListRef = useRef<FlatList<FeaturedItem>>(null);

	const featuredTrioIds = useMemo(() => new Set(featuredTrio.map((p) => p.id)), [featuredTrio]);
	const featuredItems = useMemo(
		() =>
			featuredTrio.map((item) => ({
				id: item.id,
				tagline: FEATURED_TAGLINES[item.badge],
				exhibitionTitle: item.title,
				venue: item.venue,
				thumbnail: item.thumbnail,
				status: item.status,
			})),
		[featuredTrio],
	);
	// 위 섹션에 이미 보인 전시는 아래 섹션에서 다시 보여주지 않는다 (캐러셀 → 마감 임박 → 추천 순)
	const carouselIds = useMemo(() => [...featuredTrioIds], [featuredTrioIds]);
	const closingSoonItems = useMemo(
		() =>
			pickClosingSoon([cultureQuery.items, kcisaQuery.items, popularItems], {
				excludeIds: carouselIds,
				// 검색 "마감 임박" 필터와 같은 기준 (1~14일, 마감일 당일은 철수 중일 수 있어 제외)
				maxDays: CLOSING_SOON_DAYS,
				minDays: CLOSING_SOON_MIN_DAYS,
			}),
		[cultureQuery.items, kcisaQuery.items, popularItems, carouselIds],
	);
	const shownAboveIds = useMemo(
		() => new Set([...carouselIds, ...closingSoonItems.map((item) => item.id)]),
		[carouselIds, closingSoonItems],
	);
	const homeRecommended = useMemo(
		() => displayedRecommended.filter((item) => !shownAboveIds.has(item.id)),
		[displayedRecommended, shownAboveIds],
	);
	const closingSoonStatus = toAsyncStatus(cultureQuery.isLoading || kcisaQuery.isLoading, false);

	const { cardWidth, interval } = getFeaturedPageMetrics(
		windowWidth,
		FEATURED_SIDE_PADDING,
		FEATURED_GAP,
	);
	const today = new Date();
	const todayLabel = `${today.getMonth() + 1}월 ${today.getDate()}일 ${WEEKDAYS[today.getDay()]}요일`;
	const hasMultipleFeatured = featuredItems.length > 1;
	const hasFeatured = featuredItems.length > 0;
	const isFeaturedLoading = !hasFeatured && (featuredLoading || popularLoading);
	const isFeaturedEmpty = !hasFeatured && !isFeaturedLoading;
	const currentFeaturedPage = Math.min(featuredIndex, Math.max(featuredItems.length - 1, 0));

	const openExhibition = useCallback((id: string) => router.push(`/(explore)/${id}`), [router]);

	const handleFeaturedScroll = useCallback(
		(e: NativeSyntheticEvent<NativeScrollEvent>) => {
			setFeaturedIndex(
				getFeaturedPageIndex(e.nativeEvent.contentOffset.x, interval, featuredItems.length),
			);
		},
		[interval, featuredItems.length],
	);

	const renderFeaturedItem = useCallback(
		({ item }: { item: FeaturedItem }) => (
			<FeaturedExhibitionHero {...item} width={cardWidth} onPress={openExhibition} />
		),
		[cardWidth, openExhibition],
	);

	const renderFeaturedSeparator = useCallback(() => <View style={{ width: FEATURED_GAP }} />, []);

	// 폭(회전)·데이터 수가 바뀌면 실제 스크롤 오프셋을 현재 페이지에 다시 맞춘다
	useEffect(() => {
		if (featuredItems.length === 0) return;
		featuredListRef.current?.scrollToOffset({
			offset: currentFeaturedPage * interval,
			animated: false,
		});
		if (currentFeaturedPage !== featuredIndex) setFeaturedIndex(currentFeaturedPage);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [interval, featuredItems.length]);

	const handleDocentPress = () => {
		// 프리미엄 여부를 아직 모르는 동안에는 구독자를 결제 화면으로 보내지 않는다.
		if (isSubscriptionLoading) return;
		router.push(isPremium ? '/(guide)/create-description' : '/settings/premium');
	};

	const handleListenDailyArtwork = () => {
		if (isSubscriptionLoading || dailyArtwork === null) return;

		if (isPremium) {
			updateStore({
				manualTitle: dailyArtwork.title,
				manualArtist: dailyArtwork.artist,
				manualYear: dailyArtwork.year,
				artworkImageUrl: dailyArtworkImageUrl ?? '',
				artworkDescription: '',
				isArtistIntro: false,
				inputMode: 'manual',
				pendingChatSeed: null,
			});
			// 해설 화면으로 넘어간 날을 기록 — 그림은 다음 날 바뀐다
			markDailyArtworkListened();
			router.push('/(guide)/description');
		} else {
			router.push('/settings/premium');
		}
	};

	return (
		<Screen variant="warm" className="px-0">
			<ScreenHeader fullBleed>
				<ScreenHeader.Left>
					<ScreenHeader.Logo />
				</ScreenHeader.Left>
				<ScreenHeader.Right>
					<View className="flex-row items-center gap-4">
						<LoginRequiredPressable
							onPress={() => router.push('/bookmark')}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="북마크"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							returnTo="/bookmark"
						>
							<Ionicons name="bookmark-outline" size={24} className="text-gray900" />
						</LoginRequiredPressable>
						<LoginRequiredPressable
							onPress={() => router.push('/notifications')}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="알림"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							returnTo="/notifications"
						>
							<Ionicons name="notifications-outline" size={24} className="text-gray900" />
						</LoginRequiredPressable>
					</View>
				</ScreenHeader.Right>
			</ScreenHeader>

			<View className="flex-row items-center gap-2 px-6 pt-1 pb-3">
				<Pressable
					onPress={() => router.push('/search')}
					accessibilityRole="button"
					accessibilityLabel="전시·미술관·작가 검색"
					className="flex-1"
					style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
				>
					{/* 검색 화면의 실제 검색바와 동일한 sharedTransitionTag — 탭 위치에서 자연스럽게 이어짐 */}
					<Animated.View sharedTransitionTag="home-search-bar">
						<SearchBar
							variant="tonal"
							editable={false}
							pointerEvents="none"
							placeholder="전시·미술관·작가 검색"
						/>
					</Animated.View>
				</Pressable>
				<IconButton
					onPress={() => router.push('/(tabs)/map')}
					accessibilityLabel="지도에서 전시 찾기"
					icon="map-outline"
					iconSize={22}
					variant="solid"
					tone="inverse"
					haptic="light"
					className="w-11 h-11 rounded-2xl"
				/>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName={cn('gap-10 pt-2', dailyArtwork ? 'pb-0' : 'pb-28')}
			>
				<View>
					<View className="px-6 mb-4">
						<Text className="text-gray600 text-[12px] font-pretendard-semibold tracking-[0.4px] mb-1">
							{todayLabel}
						</Text>
						<Text className="text-gray900 text-[26px] leading-[34px] font-hahmlet-bold">
							지금 가볼 만한 전시
						</Text>
					</View>

					{isFeaturedLoading && (
						<View className="px-6">
							<View
								className="rounded-[20px] bg-image-placeholder"
								style={{ width: cardWidth, height: Math.round(cardWidth * 1.18) }}
							/>
						</View>
					)}
					{hasFeatured && (
						<>
							<FlatList
								ref={featuredListRef}
								data={featuredItems}
								keyExtractor={(item) => item.id}
								horizontal
								// 대각선으로 세게 끌어도 가로로만 움직이고 세로로 튕기지 않게 한다
								directionalLockEnabled
								alwaysBounceVertical={false}
								showsHorizontalScrollIndicator={false}
								snapToInterval={interval}
								snapToAlignment="start"
								decelerationRate="fast"
								disableIntervalMomentum
								scrollEventThrottle={16}
								onScroll={handleFeaturedScroll}
								contentContainerStyle={{ paddingHorizontal: FEATURED_SIDE_PADDING }}
								ItemSeparatorComponent={renderFeaturedSeparator}
								renderItem={renderFeaturedItem}
							/>
							{hasMultipleFeatured && (
								<View
									className="flex-row items-center justify-between px-6 mt-4"
									accessible
									accessibilityRole="text"
									accessibilityLabel={`대표 전시 ${currentFeaturedPage + 1}번째, 총 ${featuredItems.length}개`}
								>
									<Text className="text-gray900 text-[13px] font-pretendard-semibold">
										{String(currentFeaturedPage + 1).padStart(2, '0')}
										<Text className="text-gray500">
											{` / ${String(featuredItems.length).padStart(2, '0')}`}
										</Text>
									</Text>
									<View className="flex-row items-center gap-1.5">
										{featuredItems.map((item, index) => (
											<View
												key={item.id}
												className={cn('h-1.5 rounded-full', {
													'w-5 bg-gray900': index === currentFeaturedPage,
													'w-1.5 bg-gray400': index !== currentFeaturedPage,
												})}
											/>
										))}
									</View>
								</View>
							)}
						</>
					)}
					{isFeaturedEmpty && (
						<Text className="px-6 text-gray600 text-[14px] font-pretendard-regular">
							지금 소개할 전시가 없어요
						</Text>
					)}
				</View>

				<ClosingSoonRail
					items={closingSoonItems}
					status={closingSoonStatus}
					onPress={openExhibition}
				/>

				{/* 추천은 선호 장르가 있는 사용자에게만 — 비개인화 대체 목록은 홈에서 보여주지 않는다 */}
				{isPersonalized && homeRecommended.length > 0 && (
					<RecommendedGrid
						title={name ? `${name}님을 위한 추천` : '취향 맞춤 추천'}
						subtitle="선호 장르를 바탕으로 골랐어요"
						items={homeRecommended}
						status={cultureQuery.status}
						onPress={openExhibition}
						onRefetch={cultureQuery.refetch}
					/>
				)}

				{/* 시간에 쫓기지 않는 오늘의 한 점으로 홈을 마무리한다 */}
				{dailyArtwork && (
					<DailyArtworkBand
						artwork={dailyArtwork}
						imageUrl={dailyArtworkImageUrl}
						isImageLoading={isDailyArtworkLoading}
						onListen={handleListenDailyArtwork}
						className="pb-32"
					/>
				)}
			</ScrollView>

			{/* AI 도슨트 진입 — 라벨이 있는 확장형 FAB */}
			<View
				className="absolute right-6 items-end shadow-gray900 elevation-lg"
				style={{
					bottom: Math.max(insets.bottom, 16),
					shadowOpacity: 0.28,
					shadowRadius: 14,
					shadowOffset: { width: 0, height: 6 },
				}}
			>
				<LoginRequiredPressable
					onPress={handleDocentPress}
					returnTo="/(guide)/create-description"
					accessibilityRole="button"
					accessibilityLabel="AI 도슨트로 작품 해설 만들기"
					accessibilityHint="카메라로 작품을 촬영하거나 직접 입력하여 AI 해설을 받을 수 있어요"
					className="h-[52px] flex-row items-center gap-2 rounded-full bg-secondary px-5"
					style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
				>
					<Ionicons name="camera" size={22} className="text-bg-tonal" />
					<Text className="text-bg-tonal text-[15px] font-pretendard-semibold">AI 도슨트</Text>
				</LoginRequiredPressable>
			</View>
		</Screen>
	);
}
