import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredLoader } from '@/src/components/common/CenteredLoader';
import { RetryErrorState } from '@/src/components/common/RetryErrorState';
import { SectionTitle } from '@/src/components/common/SectionTitle';
import { ExploreHomeHero } from '@/src/components/explore/ExploreHomeHero';
import { KcisaSection } from '@/src/components/explore/KcisaSection';
import {
	FeaturedExhibitionHero,
	RecommendedExhibitions,
} from '@/src/components/explore/ExploreHomeSections';
import { Screen } from '@/src/components/layout/Screen';
import {
	useExploreScreenData,
	type ExhibitionSummary,
} from '@/src/hooks/useExploreScreenData';
import { cn } from '@/src/lib/cn';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { colors } from '@/src/constants/colors';

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
			return <CenteredLoader className='py-16' />;
		}

		if (cultureStatus === 'error') {
			return (
				<RetryErrorState
					message='전시 정보를 불러오지 못했어요'
					onRetry={refetch}
					retryAccessibilityLabel='추천 전시 다시 불러오기'
					className='py-16'
				/>
			);
		}

		if (displayedRecommended.length === 0) {
			return (
				<Text className='text-muted text-[13px] font-pretendard-regular'>
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
		<Screen variant='warm'>
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
						<Ionicons name='person-outline' size={24} color={colors.primary} />
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
					<SectionTitle
						eyebrow='FOR YOU'
						title={isPersonalized ? '추천 전시 · 당신의 취향' : '추천 전시'}
					/>
					{renderRecommendedContent()}
				</View>
			</ScrollView>

			{/* FAB 영역 */}
			<View
				className='absolute right-6 items-end gap-3'
				style={{
					bottom: Math.max(insets.bottom + 16, 24),
					shadowColor: colors.primary,
					shadowOpacity: 0.28,
					shadowRadius: 14,
					shadowOffset: { width: 0, height: 6 },
					elevation: 8,
				}}
			>
				{/* 몰입 모드 pill */}
				<LoginRequiredPressable
					onPress={() => router.push('/(guide)/immersive-start')}
					accessibilityLabel='몰입 모드로 시작하기'
					accessibilityRole='button'
					className='h-[58px] w-[58px] items-center justify-center rounded-full bg-primary'
					style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
				>
					<Ionicons name='headset-outline' size={26} color={colors.bgTonal} />
				</LoginRequiredPressable>

				{/* 카메라 FAB */}
				<LoginRequiredPressable
					onPress={() => router.push('/(guide)/create-description')}
					accessibilityLabel='작품 해설 만들기'
					accessibilityHint='카메라로 작품을 촬영하거나 직접 입력하여 AI 해설을 받을 수 있어요'
					accessibilityRole='button'
					className='h-[58px] w-[58px] items-center justify-center rounded-full bg-primary'
					style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
				>
					<Ionicons name='camera' size={26} color={colors.bgTonal} />
				</LoginRequiredPressable>
			</View>
		</Screen>
	);
}
