import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { useExhibitionData } from '@/src/hooks/useExhibitionData';
import { useRecordExhibitionView } from '@/src/hooks/useRecordExhibitionView';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { useShareExhibition } from '@/src/hooks/useShareExhibition';
import { useToast } from '@/src/providers/ToastProvider';
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

	const [expanded, setExpanded] = useState(false);
	const [isDescriptionLong, setIsDescriptionLong] = useState(false);

	const { exhibition, isLoading } = useExhibitionData(id);
	const { isBookmarked, toggle } = useBookmarkStore(
		useShallow((s) => ({ isBookmarked: s.isBookmarked(id), toggle: s.toggle })),
	);
	const pushNotificationsEnabled = useSettingsStore((s) => s.pushNotificationsEnabled);
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
		toggle(id, () => showToast('저장에 실패했어요. 다시 시도해 주세요', toastOptions));
		showToast(willAdd ? '보관함에 저장했어요' : '보관함에서 삭제했어요', toastOptions);
		if (!exhibition?.endDate) return;
		if (willAdd && pushNotificationsEnabled) {
			void scheduleDeadlineNotifications(id, exhibition.title, exhibition.endDate);
			return;
		}
		if (!willAdd) {
			void cancelDeadlineNotifications(id);
		}
	}, [
		ensureAuth,
		exhibition,
		fabBottom,
		id,
		isBookmarked,
		pushNotificationsEnabled,
		showToast,
		toggle,
	]);

	const handleOpenWebsite = useCallback(() => {
		const webSite = exhibition?.web_site ?? exhibition?.homepage_url;
		if (!webSite) return;
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		void WebBrowser.openBrowserAsync(webSite);
	}, [exhibition?.homepage_url, exhibition?.web_site]);

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

	const webSite = exhibition.web_site ?? exhibition.homepage_url;

	return (
		<Screen variant="warm" className="px-0" edges={[]}>
			<View
				className="absolute left-0 right-0 z-20 px-6"
				style={{ top: insets.top + 18 }}
				pointerEvents="box-none"
			>
				<View className="flex-row items-center justify-between">
					<CircleActionButton icon="chevron-back" label="뒤로가기" onPress={() => router.back()} />
					<View className="flex-row gap-2">
						<CircleActionButton
							icon="map-outline"
							label="관람 루트 보기"
							onPress={() => router.push(`/(explore)/route?id=${id}`)}
						/>
						<CircleActionButton icon="share-outline" label="공유하기" onPress={handleShare} />
					</View>
				</View>
			</View>

			<ScrollView
				style={{ overflow: 'visible' }}
				contentContainerStyle={{
					paddingBottom: exhibition.ticketUrl ? fabBottom + 44 : fabBottom - 20,
					paddingTop: insets.top + 88,
				}}
			>
				<View>
					<View className="px-6">
						<FadeInView>
							<View className="flex-row items-center justify-between">
								<Text className="text-gray900 text-2xl leading-[38px] font-pretendard-bold">
									{exhibition.title.trim()}
								</Text>
							</View>
							<View className="flex-row items-center mt-1 gap-2.5">
								<Text className="text-gray600 text-[14px] font-pretendard-medium">
									{exhibition.eventSite
										? `${exhibition.venue} ${exhibition.eventSite}`
										: exhibition.venue}
								</Text>
								{webSite && (
									<Pressable
										onPress={handleOpenWebsite}
										hitSlop={6}
										className="flex-row items-center gap-0.5"
										accessibilityRole="link"
										accessibilityLabel="공식 웹사이트 외부 브라우저에서 열기"
									>
										<Ionicons name="open-outline" size={18} color="#1C1917" />
									</Pressable>
								)}
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
									accessibilityLabel={`${exhibition.title} 전시 포스터`}
									useImageProxy
								/>
								<View className="absolute top-3 right-6">
									<FloatingIconButton
										onPress={handleBookmark}
										variant="onPhoto"
										haptic
										accessibilityLabel={isBookmarked ? '보관함에서 삭제' : '보관함에 저장'}
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

					{exhibition.description && (
						<FadeInView delay={260}>
							<View className="pt-6 px-6">
								<Text
									className="font-pretendard-light text-[15px] leading-[26px] text-gray-600"
									numberOfLines={expanded ? undefined : 3}
								>
									{exhibition.description}
								</Text>
								{/* 화면에 보이지 않는 전체 텍스트로 실제 줄 수를 재서 3줄 초과 여부만 확인한다 */}
								<Text
									className="absolute opacity-0 font-pretendard-light text-[15px] leading-[26px]"
									style={{ zIndex: -1 }}
									pointerEvents="none"
									onTextLayout={(e) => setIsDescriptionLong(e.nativeEvent.lines.length > 3)}
								>
									{exhibition.description}
								</Text>
								{isDescriptionLong && (
									<Pressable
										onPress={() => setExpanded((prev) => !prev)}
										className="mt-2"
										accessibilityRole="button"
										accessibilityLabel={expanded ? '설명 접기' : '설명 더보기'}
									>
										<Text className="text-gray-400 text-[13px] font-pretendard-medium">
											{expanded ? '접기' : '더보기'}
										</Text>
									</Pressable>
								)}
							</View>
						</FadeInView>
					)}

					{(exhibition.exhibitionType ||
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

					{exhibition.note && (
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

					{exhibition.accessibility && (
						<FadeInView delay={380}>
							<Text className="font-pretendard-bold text-lg text-gray900 mb-4 px-6 mt-10">
								접근성 정보
							</Text>
							<View className="px-6">
								<AccessibilityBadges accessibility={exhibition.accessibility as string} />
							</View>
						</FadeInView>
					)}

					{exhibition.coordinates && (
						<FadeInView delay={420}>
							<Text className="font-pretendard-bold text-lg text-gray900 mb-4 px-6 mt-10">
								위치 정보
							</Text>
							<ExhibitionMapPreview
								coordinates={exhibition.coordinates}
								venueName={exhibition.venueGroupName ?? exhibition.venue}
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
				style={{ bottom: exhibition.ticketUrl ? fabBottom + 80 : fabBottom }}
			>
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
