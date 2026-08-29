import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CenteredLoader } from '@/src/components/common/CenteredLoader';
import { RetryErrorState } from '@/src/components/common/RetryErrorState';
import { SectionTitle } from '@/src/components/common/SectionTitle';
import { KcisaSection } from '@/src/components/explore/KcisaSection';
import { KcisaExhibitionCard } from '@/src/components/explore/KcisaExhibitionCard';
import { FeaturedCarousel } from '@/src/components/explore/FeaturedCarousel';
import { PopularSection } from '@/src/components/explore/PopularSection';
import { Screen } from '@/src/components/layout/Screen';
import { useExploreScreenData, type ExhibitionSummary } from '@/src/hooks/useExploreScreenData';
import { usePopularExhibitions } from '@/src/hooks/usePopularExhibitions';
import { Fab } from '@/src/components/common/Fab';
import { colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/store/authStore';

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

	const carousel = resolveKcisaCarousel();
	const name = useAuthStore((s) => s.user?.user_metadata?.full_name);

	const openExhibition = (id: string) => router.push(`/(explore)/${id}`);

	function resolveKcisaCarousel(): ExhibitionSummary[] {
		if (kcisaCarousel.length > 0) return kcisaCarousel;
		if (featured?.source === 'kcisa') return [];
		return kcisaItems;
	}

	function renderRecommendedContent() {
		if (cultureStatus === 'loading' && displayedRecommended.length === 0) {
			return <CenteredLoader className="py-16" />;
		}

		if (cultureStatus === 'error') {
			return (
				<RetryErrorState
					message="전시 정보를 불러오지 못했어요"
					onRetry={refetch}
					retryAccessibilityLabel="추천 전시 다시 불러오기"
					className="py-16"
				/>
			);
		}

		if (displayedRecommended.length === 0) {
			return (
				<Text className="text-gray500 text-[13px] font-pretendard-regular">추천할 전시가 없어요</Text>
			);
		}

		return (
			<View className="-mx-6">
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						flexDirection: 'row',
						gap: 14,
						paddingHorizontal: 24,
					}}
				>
					{displayedRecommended.map((item) => (
						<KcisaExhibitionCard key={item.id} item={item} onPress={openExhibition} />
					))}
				</ScrollView>
			</View>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header className="items-end pb-3">
				<Screen.Header.Logo />
				<Screen.Header.Right>
					<Pressable
						onPress={() => router.push('/settings')}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="마이페이지"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name="person-outline" size={24} className="text-gray900" />
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 96, gap: 28, paddingTop: 16 }}
			>
				<FeaturedCarousel items={featuredCarousel} onPress={openExhibition} />

				<PopularSection
					items={popularItems}
					status={popularStatus}
					onPress={openExhibition}
					onRefetch={popularRefetch}
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
					{renderRecommendedContent()}
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
				{/* 몰입 모드 pill */}
				<Fab
					onPress={() => router.push('/(guide)/immersive-start')}
					icon="headset-outline"
					accessibilityLabel="몰입 모드로 시작하기"
					needsLogin
				/>

				{/* 카메라 FAB */}
				<Fab
					onPress={() => router.push('/(guide)/create-description')}
					icon="camera"
					accessibilityLabel="작품 해설 만들기"
					accessibilityHint="카메라로 작품을 촬영하거나 직접 입력하여 AI 해설을 받을 수 있어요"
					needsLogin
				/>
			</View>
		</Screen>
	);
}
