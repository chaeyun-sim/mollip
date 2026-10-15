import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { FadeInView } from '@/src/components/common/FadeInView';
import { IconButton } from '@/src/components/common/IconButton';
import { SearchBar } from '@/src/components/common/SearchBar';
import { DepartureBoard } from '@/src/components/home/DepartureBoard';
import { HomeRecommendedGrid } from '@/src/components/home/HomeRecommendedGrid';
import { RecommendedIndex } from '@/src/components/home/RecommendedIndex';
import { Screen } from '@/src/components/layout/Screen';
import { useMarkInteractive } from '@/src/hooks/useMarkInteractive';
import { usePopularExhibitions } from '@/src/hooks/queries/usePopularExhibitions';
import { useExploreScreenData } from '@/src/hooks/queries/useExploreScreenData';
import { useFeaturedTrio } from '@/src/hooks/queries/useFeaturedTrio';
import { useSubscription } from '@/src/hooks/useSubscription';
import { useAuthStore } from '@/src/store/authStore';
import { toAsyncStatus } from '@/src/types/asyncStatus.types';
import { pickDepartureRows } from '@/src/utils/homeExhibitionMeta';
import { fillToCount } from '@/src/utils/homeLayout';
import { CommonHeader } from '@/src/components/common/CommonHeader';

const GRID_ITEM_COUNT = 4;
/** 추천 카드 4장이 순서대로 떠오른 다음 안내판이 등장하도록 */
const BOARD_ENTER_DELAY_MS = 280;

export default function ExploreScreen() {
	useMarkInteractive();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const name = useAuthStore((s) => s.user?.user_metadata?.full_name);
	const { isPremium, isLoading: isSubscriptionLoading } = useSubscription();

	const { kcisaQuery, cultureQuery, featuredCarousel, displayedRecommended, isPersonalized } =
		useExploreScreenData();

	// 인기 데이터는 '이번 주의 전시'의 '인기 전시' 자리를 고르는 데만 쓴다
	const { data: popularItems = [], isLoading: popularLoading } = usePopularExhibitions(
		featuredCarousel.map((item) => item.id),
	);

	// 이번 주의 전시: 특별전 · 인기 · 곧 개봉 3점
	const { picks: featuredTrio, isLoading: featuredLoading } = useFeaturedTrio(popularItems);

	// 추천 전시 2×2: 대표 3점에 인기 전시 1점을 더해 4칸을 채운다
	const gridItems = useMemo(
		() =>
			fillToCount(
				featuredTrio,
				popularItems.map((item) => ({ ...item, badge: 'popular' as const })),
				GRID_ITEM_COUNT,
			),
		[featuredTrio, popularItems],
	);
	// 위 섹션에 이미 보인 전시는 아래 섹션에서 다시 보여주지 않는다 (추천 전시 → 출발 안내판 → 개인화 추천 순)
	const featuredIds = useMemo(() => gridItems.map((p) => p.id), [gridItems]);
	// 출발 안내판: 곧 마감 3 · 진행 중 3 · 개막 예정 2
	const departures = useMemo(
		() =>
			pickDepartureRows([cultureQuery.items, kcisaQuery.items, popularItems], {
				excludeIds: featuredIds,
			}),
		[cultureQuery.items, kcisaQuery.items, popularItems, featuredIds],
	);
	const shownAboveIds = useMemo(
		() => new Set([...featuredIds, ...departures.rows.map((item) => item.id)]),
		[featuredIds, departures],
	);
	const homeRecommended = useMemo(
		() => displayedRecommended.filter((item) => !shownAboveIds.has(item.id)),
		[displayedRecommended, shownAboveIds],
	);
	const departuresStatus = toAsyncStatus(cultureQuery.isLoading || kcisaQuery.isLoading, false);

	const openExhibition = useCallback((id: string) => router.push(`/(explore)/${id}`), [router]);

	const handleDocentPress = () => {
		// 프리미엄 여부를 아직 모르는 동안에는 구독자를 결제 화면으로 보내지 않는다.
		if (isSubscriptionLoading) return;
		router.push(isPremium ? '/(guide)/create-description' : '/settings/premium');
	};

	// 도록 목차처럼 보이는 섹션에만 번호를 이어서 매긴다 (숨겨진 섹션 번호는 건너뛰지 않는다)
	const showRecommended = isPersonalized && homeRecommended.length > 0;

	return (
		<Screen variant="warm" className="px-0">
			<CommonHeader fullBleed />

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-7 pb-28">
				{/* 마스트헤드 — 검색 + 지도 */}
				<FadeInView>
					<View className="px-6 pt-1">
						<View className="flex-row items-center gap-2">
							<Pressable
								onPress={() => router.push('/search')}
								accessibilityRole="button"
								accessibilityLabel="전시·미술관·작가 검색"
								className="flex-1"
								style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
							>
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
					</View>
				</FadeInView>

				<HomeRecommendedGrid
					index={1}
					items={gridItems}
					isLoading={featuredLoading || popularLoading}
					onPress={openExhibition}
				/>

				{/* 추천 카드가 다 떠오른 뒤 안내판이 이어서 등장한다 */}
				<FadeInView delay={BOARD_ENTER_DELAY_MS}>
					<DepartureBoard
						index={2}
						rows={departures.rows}
						nearest={departures.nearest}
						status={departuresStatus}
						onPress={openExhibition}
					/>
				</FadeInView>

				{/* 선호 장르에 맞는 실제 추천 결과가 있을 때만 보여준다. */}
				{showRecommended && (
					<RecommendedIndex
						title={name ? `${name}님의 취향 저격!` : '취향 맞춤 추천'}
						items={homeRecommended}
						onPress={openExhibition}
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
					className="h-[52px] flex-row items-center gap-2 rounded-full bg-brand px-5"
					style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
				>
					<Ionicons name="camera" size={22} className="text-white" />
					<Text className="text-white text-[15px] font-pretendard-semibold">AI 도슨트</Text>
				</LoginRequiredPressable>
			</View>
		</Screen>
	);
}
