import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import {
	AccessibilityBadges,
	ExhibitionDescription,
	ExhibitionDetailFloatingActions,
	ExhibitionDetailHeader,
	ExhibitionDetailHero,
	ExhibitionImmersiveFab,
	ExhibitionMapPreview,
	ExhibitionMetaPill,
	ExhibitionTicketCTA,
	ExhibitionVenueInfo,
	ImmersiveOverlay,
	RelatedExhibitions,
} from '@/src/components/explore';
import { ExhibitionDetailSkeleton } from '@/src/components/layout/Loading';
import { Result } from '@/src/components/common/Result';
import { Screen } from '@/src/components/layout/Screen';
import { useExhibitionData } from '@/src/hooks/useExhibitionData';
import { useHeroAnimation } from '@/src/hooks/useHeroAnimation';
import { useRecordExhibitionView } from '@/src/hooks/useRecordExhibitionView';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { useShareExhibition } from '@/src/hooks/useShareExhibition';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { todayKey, useVisitStore } from '@/src/store/visitStore';
import { getExhibitionTypeDisplay } from '@/src/utils/exhibitionSearch';
import {
	cancelDeadlineNotifications,
	scheduleDeadlineNotifications,
} from '@/src/utils/notificationScheduler';

export default function ExhibitionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [immersiveOpen, setImmersiveOpen] = useState(false);
	const enterImmersive = useImmersiveStore((s) => s.enter);
	const recordVisit = useVisitStore((s) => s.recordExhibition);

	const { exhibition, isLoading } = useExhibitionData(id);
	const { isBookmarked, toggle } = useBookmarkStore(
		useShallow((s) => ({ isBookmarked: s.isBookmarked(id), toggle: s.toggle })),
	);
	const pushNotificationsEnabled = useSettingsStore((s) => s.pushNotificationsEnabled);
	const { ensureAuth } = useRequireAuth();
	useRecordExhibitionView(id, !!exhibition);
	const { scrollHandler, heroImageStyle } = useHeroAnimation(exhibition?.id);
	const { handleShare } = useShareExhibition(exhibition ?? null);

	const fabBottom = insets.bottom + 20 + (exhibition?.ticketUrl ? 68 : 0);

	const handleBookmark = useCallback(() => {
		if (!ensureAuth(`/(explore)/${id}`)) return;
		const willAdd = !isBookmarked;
		toggle(id);
		if (!exhibition?.endDate) return;
		if (willAdd && pushNotificationsEnabled) {
			void scheduleDeadlineNotifications(id, exhibition.title, exhibition.endDate);
			return;
		}
		if (!willAdd) {
			void cancelDeadlineNotifications(id);
		}
	}, [ensureAuth, exhibition, id, isBookmarked, pushNotificationsEnabled, toggle]);

	const handleStartImmersive = useCallback(() => {
		setImmersiveOpen(false);
		if (!ensureAuth(`/(explore)/${id}`) || !exhibition) return;
		enterImmersive(id, exhibition.title);
		recordVisit(todayKey(), id, {
			title: exhibition.title,
			venue: exhibition.venue,
			thumbnail: exhibition.posterImage ?? exhibition.heroImageUri,
		});
		router.replace('/(guide)/playlist');
	}, [ensureAuth, enterImmersive, exhibition, id, recordVisit, router]);

	if (isLoading) return <ExhibitionDetailSkeleton />;

	if (!exhibition) {
		return (
			<SafeAreaView className="flex-1 bg-bg-light">
				<Result
					icon="alert-circle-outline"
					title="전시를 찾을 수 없어요"
					actionLabel="돌아가기"
					onAction={() => router.back()}
				/>
			</SafeAreaView>
		);
	}

	return (
		<Screen variant="warm" className="px-0" edges={['bottom']}>
			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				bounces={false}
				contentContainerStyle={{ paddingBottom: fabBottom + 40 }}
			>
				<ExhibitionDetailHero
					title={exhibition.title}
					heroImageUri={exhibition.heroImageUri}
					posterImage={exhibition.posterImage}
					animatedStyle={heroImageStyle}
				/>

				<FadeInView delay={100}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerClassName="px-[18px] py-4 gap-2"
					>
						<ExhibitionMetaPill icon="location-outline" text={exhibition.venue} />
						{exhibition.exhibitionType && (
							<ExhibitionMetaPill text={getExhibitionTypeDisplay(exhibition)} />
						)}
						{exhibition.genre &&
							exhibition.genre
								.split(',')
								.map((g) => <ExhibitionMetaPill key={g} text={g.trim()} />)}
					</ScrollView>
				</FadeInView>

				<FadeInView delay={170}>
					<ExhibitionDetailHeader
						title={exhibition.title}
						startDate={exhibition.startDate}
						endDate={exhibition.endDate}
						webSite={exhibition.web_site ?? exhibition.homepage_url}
					/>
				</FadeInView>

				{exhibition.description && (
					<FadeInView delay={200}>
						<ExhibitionDescription description={exhibition.description} />
					</FadeInView>
				)}

				{exhibition.tags && (
					<FadeInView delay={250}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerClassName="px-[18px] pt-3 pb-1 gap-2"
						>
							{exhibition.tags.map((tag) => (
								<ExhibitionMetaPill key={tag} icon="pricetag-outline" text={tag} />
							))}
						</ScrollView>
					</FadeInView>
				)}

				{exhibition.note && (
					<FadeInView delay={280}>
						<View className="mx-6 mt-10 px-4 py-3.5 rounded-2xl bg-[#F0EDE7] flex-row gap-3">
							<Ionicons
								name="information-circle-outline"
								size={17}
								className="text-gray600"
								style={{ marginTop: 1 }}
							/>
							<Text className="flex-1 text-[13px] leading-[20px] text-gray700 font-pretendard-regular">
								{exhibition.note}
							</Text>
						</View>
					</FadeInView>
				)}

				<FadeInView delay={300}>
					<ExhibitionVenueInfo
						venueAddress={exhibition.venueAddress}
						eventSite={exhibition.eventSite}
						phone={exhibition.phone}
						openHours={exhibition.openHours}
						admission={exhibition.admission}
						hasTopSpacing={!!(exhibition.note || exhibition.tags || exhibition.description)}
					/>
				</FadeInView>

				{exhibition.accessibility && (
					<FadeInView delay={350}>
						<Text className="font-pretendard-semibold text-[18px] text-gray-900 mb-4 px-6 mt-10">
							접근성 정보
						</Text>
						<View className="px-6">
							<AccessibilityBadges accessibility={exhibition.accessibility as string} />
						</View>
					</FadeInView>
				)}

				{exhibition.coordinates && (
					<FadeInView delay={350}>
						<Text className="font-pretendard-semibold text-[18px] text-gray-900 mb-4 px-6 mt-10">
							위치 정보
						</Text>
						<ExhibitionMapPreview
							coordinates={exhibition.coordinates}
							venueName={exhibition.venueGroupName ?? exhibition.venue}
						/>
					</FadeInView>
				)}

				{exhibition.relatedExhibitions && exhibition.relatedExhibitions.length > 0 && (
					<FadeInView delay={500}>
						<RelatedExhibitions exhibitions={exhibition.relatedExhibitions} />
					</FadeInView>
				)}
			</Animated.ScrollView>

			<ExhibitionDetailFloatingActions
				onBack={() => router.back()}
				onShare={handleShare}
				onRoute={() => router.push(`/(explore)/route?id=${id}`)}
				onBookmark={handleBookmark}
				isBookmarked={isBookmarked}
				insetTop={insets.top}
			/>

			{exhibition.ticketUrl && (
				<View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
					<SafeAreaView edges={['bottom']}>
						<ExhibitionTicketCTA ticketUrl={exhibition.ticketUrl} />
					</SafeAreaView>
				</View>
			)}

			{/* 몰입하기 FAB — 스크롤 위치 무관하게 항상 우하단에 고정.
			    CTA(예매하기)가 있으면 그 높이만큼 위로 올린다. */}
			<View className="absolute right-5" style={{ bottom: fabBottom }}>
				<ExhibitionImmersiveFab onPress={() => setImmersiveOpen(true)} />
			</View>

			<ImmersiveOverlay
				visible={immersiveOpen}
				title={exhibition.title}
				onStart={handleStartImmersive}
				onClose={() => setImmersiveOpen(false)}
			/>
		</Screen>
	);
}

function FadeInView({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(24);

	useEffect(() => {
		opacity.value = withDelay(delay, withTiming(1, { duration: 450 }));
		translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
	}, [delay, opacity, translateY]);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return <Animated.View style={style}>{children}</Animated.View>;
}
