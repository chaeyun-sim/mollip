import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
	AccessibilityBadges,
	ExhibitionDescription,
	ExhibitionDetailFloatingActions,
	ExhibitionDetailHeader,
	ExhibitionImmersiveFab,
	ExhibitionMapPreview,
	ExhibitionMetaPill,
	ExhibitionTicketCTA,
	ExhibitionVenueInfo,
	ImmersiveOverlay,
	RelatedExhibitions,
	RouteSheet,
} from '@/src/components/explore';
import { FadeInView } from '@/src/components/common/FadeInView';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ExhibitionDetailSkeleton } from '@/src/components/layout/Loading';
import { useExhibitionData } from '@/src/hooks/useExhibitionData';
import { useHeroAnimation } from '@/src/hooks/useHeroAnimation';
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
import { Screen } from '@/src/components/layout/Screen';

export default function ExhibitionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [immersiveOpen, setImmersiveOpen] = useState(false);
	const [routeOpen, setRouteOpen] = useState(false);
	const enterImmersive = useImmersiveStore((s) => s.enter);
	const recordVisit = useVisitStore((s) => s.recordExhibition);

	const { exhibition, isLoading } = useExhibitionData(id);
	const isBookmarked = useBookmarkStore((s) => s.isBookmarked(id));
	const toggle = useBookmarkStore((s) => s.toggle);
	const pushNotificationsEnabled = useSettingsStore((s) => s.pushNotificationsEnabled);
	const { ensureAuth } = useRequireAuth();

	const { scrollHandler, heroImageStyle } = useHeroAnimation(exhibition?.id);
	const { handleShare } = useShareExhibition(exhibition ?? null);

	const fabBottom = insets.bottom + 20 + (exhibition?.ticketUrl ? 68 : 0);
	const HERO_HEIGHT = Dimensions.get('window').height * 0.62;

	if (isLoading) return <ExhibitionDetailSkeleton />;

	if (!exhibition) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center bg-bg-light">
				<Text className="text-gray-500 text-base font-pretendard-regular mb-4">
					전시를 찾을 수 없어요
				</Text>
				<Pressable onPress={() => router.back()}>
					<Text className="text-gray-900 text-sm font-pretendard-medium">돌아가기</Text>
				</Pressable>
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
				<View className="overflow-hidden w-full" style={{ height: HERO_HEIGHT }}>
					<Animated.View style={[{ width: '100%', height: HERO_HEIGHT }, heroImageStyle]}>
						<ImageFallback
							heroImageUri={exhibition.heroImageUri}
							posterImage={exhibition.posterImage}
							style={{ height: HERO_HEIGHT }}
							iconSize={160}
							resizeMode="cover"
							dimOverlay
							className="w-full"
							accessibilityLabel={`${exhibition.title} 전시 포스터`}
						/>
					</Animated.View>

					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.7)']}
						className="absolute bottom-0 left-0 right-0 h-[292px] justify-end pb-6"
					/>
				</View>

				<FadeInView delay={100}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							paddingHorizontal: 18,
							paddingVertical: 16,
							gap: 8,
						}}
					>
						<ExhibitionMetaPill icon="location-outline" text={exhibition.venue} />
						{exhibition.exhibitionType && (
							<ExhibitionMetaPill text={getExhibitionTypeDisplay(exhibition)} />
						)}
						{exhibition.genre &&
							exhibition.genre.split(',').map((g) => <ExhibitionMetaPill key={g} text={g} />)}
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
							contentContainerStyle={{
								paddingHorizontal: 18,
								paddingTop: 12,
								paddingBottom: 4,
								gap: 8,
							}}
						>
							{(exhibition.tags ?? [])?.map((tag) => (
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
								className="text-tertiary"
								style={{ marginTop: 1 }}
							/>
							<Text className="flex-1 text-[13px] leading-[20px] text-secondary font-pretendard-regular">
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
				onBookmark={() => {
					if (!ensureAuth(`/(explore)/${id}`)) return;
					const willAdd = !isBookmarked;
					toggle(id);
					if (!exhibition?.endDate) return;
					if (willAdd) {
						if (pushNotificationsEnabled) {
							void scheduleDeadlineNotifications(id, exhibition.title, exhibition.endDate);
						}
					} else {
						void cancelDeadlineNotifications(id);
					}
				}}
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
				onStart={() => {
					setImmersiveOpen(false);
					enterImmersive(id, exhibition.title);
					recordVisit(todayKey(), id, {
						title: exhibition.title,
						venue: exhibition.venue,
						thumbnail: exhibition.posterImage ?? exhibition.heroImageUri,
					});
					router.replace('/(guide)/playlist');
				}}
				onClose={() => setImmersiveOpen(false)}
			/>

			<RouteSheet
				visible={routeOpen}
				exhibitionTitle={exhibition.title}
				venue={exhibition.venue}
				artworks={exhibition.artworks}
				onClose={() => setRouteOpen(false)}
			/>
		</Screen>
	);
}
