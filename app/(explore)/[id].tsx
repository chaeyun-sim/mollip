import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { FadeInView } from '@/src/components/common/FadeInView';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { Result } from '@/src/components/common/Result';
import {
	AccessibilityBadges,
	CircleActionButton,
	ExhibitionImmersiveFab,
	ExhibitionMapPreview,
	ExhibitionMetaPill,
	ExhibitionTicketCTA,
	ExhibitionVenueInfo,
	ImmersiveOverlay,
	RelatedExhibitions,
} from '@/src/components/explore';
import { FloatingIconButton } from '@/src/components/explore/FloatingIconButton';
import { ExhibitionDetailSkeleton } from '@/src/components/layout/Loading';
import { Screen } from '@/src/components/layout/Screen';
import { useExhibitionData } from '@/src/hooks/queries/useExhibitionData';
import { useRecordExhibitionView } from '@/src/hooks/useRecordExhibitionView';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { useShareExhibition } from '@/src/hooks/useShareExhibition';
import { useToast } from '@/src/providers/ToastProvider';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { todayKey, useVisitStore } from '@/src/store/visitStore';
import { getExhibitionTypeDisplay } from '@/src/utils/exhibitionSearch';
import { localizeExhibition } from '@/src/utils/localizedExhibition';
import { cancelDeadlineNotifications } from '@/src/utils/notificationScheduler';
import { useSubscription } from '@/src/hooks/useSubscription';

export default function ExhibitionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { t, i18n } = useTranslation();
	const [immersiveOpen, setImmersiveOpen] = useState(false);
	const enterImmersive = useImmersiveStore((s) => s.enter);
	const recordVisit = useVisitStore((s) => s.recordExhibition);

	const { isPremium, isLoading: isSubscriptionLoading } = useSubscription();

	const [expanded, setExpanded] = useState(false);
	const [isDescriptionLong, setIsDescriptionLong] = useState(false);

	const { data: exhibition, isLoading } = useExhibitionData(id);
	const { isBookmarked, toggle } = useBookmarkStore(
		useShallow((s) => ({ isBookmarked: s.isBookmarked(id), toggle: s.toggle })),
	);
	const { ensureAuth } = useRequireAuth();
	const { showToast } = useToast();
	useRecordExhibitionView(id, !!exhibition);
	const { handleShare } = useShareExhibition(exhibition ?? null);

	const fabBottom = insets.bottom + 20 + (exhibition?.ticketUrl ? 68 : 0);

	const handleBookmark = useCallback(() => {
		if (!ensureAuth(`/(explore)/${id}`)) return;
		const willAdd = !isBookmarked;
		// 몰입하기 FAB(64px)와 겹치지 않도록 그 위로 띄운다.
		const toastOptions = { bottomOffset: fabBottom };
		toggle(id, () => showToast(t('exhibitions.detail.toast_bookmark_failed'), toastOptions));
		showToast(
			willAdd
				? t('exhibitions.detail.toast_bookmarked')
				: t('exhibitions.detail.toast_unbookmarked'),
			toastOptions,
		);
		if (!willAdd) {
			void cancelDeadlineNotifications(id);
		}
	}, [ensureAuth, fabBottom, id, isBookmarked, showToast, t, toggle]);

	const handleOpenWebsite = useCallback(() => {
		const webSite = exhibition?.web_site ?? exhibition?.homepage_url;
		if (!webSite) return;
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		void WebBrowser.openBrowserAsync(webSite);
	}, [exhibition?.homepage_url, exhibition?.web_site]);

	const handleStartImmersive = useCallback(() => {
		setImmersiveOpen(false);
		if (!ensureAuth(`/(explore)/${id}`) || !exhibition) return;
		// 몰입 모드·방문 기록은 한국어 원본으로 저장한다 (가이드 생성·기록 화면이 한국어 데이터를 기준으로 동작)
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
					title={t('exhibitions.detail.not_found')}
					actionLabel={t('exhibitions.detail.go_back')}
					onAction={() => router.back()}
				/>
			</SafeAreaView>
		);
	}

	const webSite = exhibition.web_site ?? exhibition.homepage_url;
	const isEn = i18n.language === 'en';
	const localized = localizeExhibition(exhibition, i18n.language);
	const description = ((isEn && exhibition.descriptionEn) || exhibition.description).trim();
	// 장르·태그·안내 노트·접근성은 영문 데이터가 없어 영어 설정에서는 숨긴다
	const showKoreanOnlyData = !isEn;

	return (
		<Screen variant="warm" className="px-0" edges={[]}>
			<View
				className="absolute left-0 right-0 z-20 px-6"
				style={{ top: insets.top + 18 }}
				pointerEvents={immersiveOpen ? 'none' : 'box-none'}
			>
				<View className="flex-row items-center justify-between">
					<CircleActionButton
						icon="chevron-back"
						label={t('common.back')}
						onPress={() => router.back()}
					/>
					<View className="flex-row gap-2">
						<CircleActionButton
							icon="share-outline"
							label={t('common.share')}
							onPress={handleShare}
						/>
					</View>
				</View>
			</View>

			<ScrollView
				style={{ overflow: 'visible' }}
				contentContainerStyle={{
					paddingBottom: exhibition.ticketUrl ? fabBottom + 68 : fabBottom + 4,
					paddingTop: insets.top + 88,
				}}
			>
				<View>
					<View className="px-6">
						<FadeInView>
							<View className="flex-row items-center justify-between">
								<Text className="flex-1 text-gray900 text-2xl leading-[30px] font-pretendard-bold">
									{localized.title}
								</Text>
								{webSite && (
									<Pressable
										onPress={handleOpenWebsite}
										className="h-11 w-11 shrink-0 items-center justify-center"
										accessibilityRole="link"
										accessibilityLabel={t('exhibitions.detail.open_website_a11y')}
									>
										<Ionicons name="open-outline" size={18} color="#1C1917" />
									</Pressable>
								)}
							</View>
							<View className="flex-row items-start mt-1 gap-2.5">
								<View className="flex-1 min-w-0">
									<Text
										className="text-gray600 text-[15px] font-pretendard-medium"
										numberOfLines={2}
									>
										{localized.venue}
									</Text>
									{showKoreanOnlyData && exhibition.eventSite && (
										<Text
											className="mt-1 text-gray600 text-[13px] font-pretendard-regular"
											numberOfLines={2}
										>
											{exhibition.eventSite}
										</Text>
									)}
								</View>
							</View>
						</FadeInView>

						<FadeInView delay={80}>
							<View className="mt-7 relative rounded-[8px] bg-white overflow-hidden shadow-black elevation-sm w-[90%] mx-auto">
								<ImageFallback
									heroImageUri={exhibition.heroImageUri}
									posterImage={exhibition.posterImage}
									className="h-[430px] w-full"
									iconSize={120}
									resizeMode="cover"
									accessibilityLabel={t('exhibitions.detail.poster_a11y', {
										title: localized.title,
									})}
									useImageProxy
								/>
								<View className="absolute top-3 right-6">
									<FloatingIconButton
										onPress={handleBookmark}
										variant="onPhoto"
										haptic
										accessibilityLabel={
											isBookmarked
												? t('exhibitions.detail.bookmark_remove_a11y')
												: t('exhibitions.detail.bookmark_add_a11y')
										}
										icon={
											<Ionicons
												name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
												size={20}
												color="#FFFFFF"
											/>
										}
									/>
								</View>
							</View>
						</FadeInView>
					</View>

					{description && (
						<FadeInView delay={260}>
							<View className="pt-6 px-6">
								<Text
									className="font-pretendard-light text-[15px] leading-[26px] text-gray-600"
									numberOfLines={expanded ? undefined : 3}
								>
									{description}
								</Text>
								{/* 화면에 보이지 않는 전체 텍스트로 실제 줄 수를 재서 3줄 초과 여부만 확인한다 */}
								<Text
									className="absolute opacity-0 font-pretendard-light text-[15px] leading-[26px]"
									style={{ zIndex: -1 }}
									pointerEvents="none"
									onTextLayout={(e) => setIsDescriptionLong(e.nativeEvent.lines.length > 3)}
								>
									{description}
								</Text>
								{isDescriptionLong && (
									<Pressable
										onPress={() => setExpanded((prev) => !prev)}
										className="mt-2"
										accessibilityRole="button"
										accessibilityLabel={
											expanded
												? t('exhibitions.detail.description_less_a11y')
												: t('exhibitions.detail.description_more_a11y')
										}
									>
										<Text className="text-gray-400 text-[13px] font-pretendard-medium">
											{expanded
												? t('exhibitions.detail.description_less')
												: t('exhibitions.detail.description_more')}
										</Text>
									</Pressable>
								)}
							</View>
						</FadeInView>
					)}

					{showKoreanOnlyData &&
						(exhibition.exhibitionType ||
							exhibition.genre ||
							(exhibition.tags?.length ?? 0) > 0) && (
							<FadeInView delay={210}>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerClassName="px-6 pt-5 pb-1 gap-2"
								>
									{exhibition.exhibitionType && (
										<ExhibitionMetaPill text={getExhibitionTypeDisplay(exhibition)} />
									)}
									{exhibition.genre &&
										exhibition.genre
											.split(',')
											.map((g) => <ExhibitionMetaPill key={g} text={g.trim()} />)}
									{exhibition.tags?.map((tag) => (
										<ExhibitionMetaPill key={tag} icon="pricetag-outline" text={tag} />
									))}
								</ScrollView>
							</FadeInView>
						)}

					{showKoreanOnlyData && exhibition.note && (
						<FadeInView delay={300}>
							<View className="mx-6 mt-4 px-4 py-3.5 rounded-2xl bg-[#F0EDE7] flex-row gap-3">
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

					<FadeInView delay={340} style={{ zIndex: 40, elevation: 40 }}>
						<ExhibitionVenueInfo {...exhibition} hasTopSpacing />
					</FadeInView>

					{showKoreanOnlyData && exhibition.accessibility && (
						<FadeInView delay={380}>
							<Text className="font-pretendard-bold text-lg text-gray900 mb-4 px-6 mt-10">
								{t('exhibitions.detail.accessibility_info')}
							</Text>
							<View className="px-6">
								<AccessibilityBadges accessibility={exhibition.accessibility as string} />
							</View>
						</FadeInView>
					)}

					{exhibition.coordinates && (
						<FadeInView delay={420}>
							<Text className="font-pretendard-bold text-lg text-gray900 mb-4 px-6 mt-10">
								{t('exhibitions.detail.location_info')}
							</Text>
							<ExhibitionMapPreview
								coordinates={exhibition.coordinates}
								venueName={exhibition.venueGroupName ?? exhibition.venue}
								displayVenueName={localized.venue}
							/>
						</FadeInView>
					)}

					{exhibition.relatedExhibitions && exhibition.relatedExhibitions.length > 0 && (
						<FadeInView delay={460}>
							<RelatedExhibitions exhibitions={exhibition.relatedExhibitions} />
						</FadeInView>
					)}
				</View>
			</ScrollView>

			{exhibition.ticketUrl && (
				<View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
					<SafeAreaView edges={['bottom']}>
						<ExhibitionTicketCTA ticketUrl={exhibition.ticketUrl} />
					</SafeAreaView>
				</View>
			)}

			<View
				className="absolute right-5"
				style={{ bottom: exhibition.ticketUrl ? fabBottom + 30 : fabBottom + 100 }}
			>
				<ExhibitionImmersiveFab
					onPress={() => {
						// 프리미엄 여부를 아직 모르는 동안에는 구독자를 결제 화면으로 보내지 않는다.
						if (isSubscriptionLoading) return;
						if (isPremium) setImmersiveOpen(true);
						else router.push('/settings/premium');
					}}
				/>
			</View>

			<ImmersiveOverlay
				visible={immersiveOpen}
				title={localized.title}
				onStart={handleStartImmersive}
				onClose={() => setImmersiveOpen(false)}
			/>
		</Screen>
	);
}
