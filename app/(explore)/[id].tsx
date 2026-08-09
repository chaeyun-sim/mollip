import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Linking,
	Platform,
	Pressable,
	ScrollView,
	Share,
	Text,
	View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	ExhibitionArtworkCard,
	ExhibitionDetailFloatingActions,
	ExhibitionImmersiveFab,
	ExhibitionInfoRow,
	ExhibitionMetaPill,
	ExhibitionTicketCTA,
	ImmersiveOverlay,
	RelatedExhibitions,
} from '@/src/components/explore';
import { FadeInView } from '@/src/components/common/FadeInView';
import { ExhibitionPoster } from '@/src/components/common/EmptyImagePlaceholder';
import { useExhibitionData } from '@/src/hooks/useExhibitionData';
import { useHeroAnimation } from '@/src/hooks/useHeroAnimation';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { todayKey, useVisitStore } from '@/src/store/visitStore';
import {
	getExhibitionTypeDisplay,
	getGenreTag,
	splitArtistNames,
} from '@/src/utils/exhibitionSearch';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;

export default function ExhibitionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [descriptionExpanded, setDescriptionExpanded] = useState(false);
	const [immersiveOpen, setImmersiveOpen] = useState(false);
	const enterImmersive = useImmersiveStore((s) => s.enter);
	const recordVisit = useVisitStore((s) => s.recordExhibition);
	const setImmersiveMode = useImmersiveStore((s) => s.setImmersiveMode);

	const { exhibition, isLoading } = useExhibitionData(id);
	const isBookmarked = useBookmarkStore((s) => s.isBookmarked(id));
	const toggle = useBookmarkStore((s) => s.toggle);
	const { ensureAuth } = useRequireAuth();

	const { scrollHandler, heroImageStyle } = useHeroAnimation(exhibition?.id);

	const handleShare = async () => {
		const title = exhibition?.title ?? '';
		const message = `${title}\n📍 ${exhibition?.venue}\n🗓 ${exhibition?.startDate} - ${exhibition?.endDate}`;
		const linkUrl = exhibition?.web_site ?? 'https://mollip.app';
		const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

		if (kakaoKey) {
			const templateJson = encodeURIComponent(
				JSON.stringify({
					object_type: 'text',
					text: message,
					link: { mobile_web_url: linkUrl, web_url: linkUrl },
				}),
			);
			const kakaoUrl =
				Platform.OS === 'android'
					? `intent://send?app_key=${kakaoKey}&template_json=${templateJson}#Intent;scheme=kakaolink;package=com.kakao.talk;end;`
					: `kakaolink://send?app_key=${kakaoKey}&template_json=${templateJson}`;

			const canOpen = await Linking.canOpenURL('kakaolink://');
			if (canOpen) {
				await Linking.openURL(kakaoUrl);
				return;
			}
		}

		try {
			await Share.share({ message, title });
		} catch {
			// share cancelled
		}
	};

	if (isLoading) {
		return (
			<SafeAreaView className='flex-1 items-center justify-center bg-[#F8F6F2]'>
				<ActivityIndicator color='#9CA3AF' />
			</SafeAreaView>
		);
	}

	if (!exhibition) {
		return (
			<SafeAreaView className='flex-1 items-center justify-center bg-[#F8F6F2]'>
				<Text className='text-gray-500 text-base font-pretendard-regular mb-4'>
					전시를 찾을 수 없어요
				</Text>
				<Pressable onPress={() => router.back()}>
					<Text className='text-gray-900 text-sm font-pretendard-medium underline'>
						돌아가기
					</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	return (
		<View className='flex-1 bg-[#F8F6F2]'>
			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				bounces={false}
				contentContainerStyle={{ paddingBottom: 160 }}
			>
				<View className='overflow-hidden w-full' style={{ height: HERO_HEIGHT }}>
					<Animated.View
						style={[{ width: '100%', height: HERO_HEIGHT }, heroImageStyle]}
					>
						<ExhibitionPoster
							heroImageUri={exhibition.heroImageUri}
							posterImage={exhibition.posterImage}
							style={{ height: HERO_HEIGHT }}
							iconSize={160}
							resizeMode='cover'
							dimOverlay
							className='w-full'
						/>
					</Animated.View>

					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.7)']}
						className='absolute bottom-0 left-0 right-0 h-[292px] justify-end pb-6 px-6'
					/>

					<View className='absolute bottom-6 right-6'>
						<ExhibitionImmersiveFab onPress={() => setImmersiveOpen(true)} />
					</View>
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
						<ExhibitionMetaPill icon='location-outline' text={exhibition.venue} />
						{exhibition.exhibitionType && (
							<ExhibitionMetaPill text={getExhibitionTypeDisplay(exhibition)} />
						)}
						{exhibition.genre &&
							exhibition.genre
								.split(',')
								.map((g) => <ExhibitionMetaPill key={g} text={g} />)}
					</ScrollView>
				</FadeInView>

				<FadeInView delay={170}>
					<View className='px-6 pb-3'>
						<Text className='text-gray-900 text-[26px] leading-[34px] font-pretendard-bold'>
							{exhibition.title.trim()}
						</Text>
						<View className='flex-row items-center flex-wrap gap-x-3 gap-y-1 mt-3'>
							<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
								{exhibition.startDate} - {exhibition.endDate}
							</Text>
							{(exhibition.web_site ?? exhibition.homepage_url) ? (
								<Pressable
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										WebBrowser.openBrowserAsync(
											exhibition.web_site ?? exhibition.homepage_url!,
										);
									}}
									hitSlop={6}
									className='flex-row items-center gap-0.5'
									accessibilityRole='link'
									accessibilityLabel={`공식 웹사이트 외부 브라우저에서 열기`}
								>
									<Text className='text-[#1C1917] text-[13px] font-pretendard-medium'>
										공식 웹사이트
									</Text>
									<Ionicons name='open-outline' size={12} color='#1C1917' />
								</Pressable>
							) : null}
						</View>
					</View>
				</FadeInView>

				<FadeInView delay={200}>
					<View className='px-6'>
						{exhibition.description ? (
							<>
								<Text
									className='font-pretendard-light text-[15px] leading-[26px] text-gray-600'
									numberOfLines={descriptionExpanded ? undefined : 3}
								>
									{exhibition.description}
								</Text>
								<Pressable
									onPress={() => setDescriptionExpanded((prev) => !prev)}
									className='mt-2'
								>
									<Text className='text-gray-400 text-[13px] font-pretendard-medium'>
										{descriptionExpanded ? '접기' : '더보기'}
									</Text>
								</Pressable>
							</>
						) : null}
					</View>
				</FadeInView>

				{(exhibition.tags?.length ?? 0) > 0 && (
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
								<ExhibitionMetaPill key={tag} icon='pricetag-outline' text={tag} />
							))}
						</ScrollView>
					</FadeInView>
				)}

				{exhibition.note && (
					<FadeInView delay={280}>
						<View className='mx-6 mt-10 px-4 py-3.5 rounded-2xl bg-[#F0EDE7] flex-row gap-3'>
							<Ionicons
								name='information-circle-outline'
								size={17}
								color='#78716C'
								style={{ marginTop: 1 }}
							/>
							<Text className='flex-1 text-[13px] leading-[20px] text-[#57534E] font-pretendard-regular'>
								{exhibition.note}
							</Text>
						</View>
					</FadeInView>
				)}

				<FadeInView delay={300}>
					<View className='px-6 pt-10'>
						<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
							관람 정보
						</Text>
						<View className='h-0.5 w-full bg-[#1C1917]' />
						{exhibition.venueAddress && (
							<ExhibitionInfoRow label='위치'>
								{exhibition.venueAddress}
							</ExhibitionInfoRow>
						)}
						{exhibition.eventSite && (
							<ExhibitionInfoRow label='전시 공간'>
								{exhibition.eventSite}
							</ExhibitionInfoRow>
						)}
						<ExhibitionInfoRow label='전화번호'>
							{exhibition.phone ?? '정보 없음'}
						</ExhibitionInfoRow>
						<ExhibitionInfoRow label='운영시간'>
							{exhibition.openHours}
						</ExhibitionInfoRow>
						<ExhibitionInfoRow label='관람료' isLast>
							{exhibition.admission.replaceAll(' / ', '\n')}
						</ExhibitionInfoRow>

						<View className='h-0.5 w-full bg-[#1C1917]' />
					</View>
				</FadeInView>

				{exhibition.relatedExhibitions &&
					exhibition.relatedExhibitions.length > 0 && (
						<FadeInView delay={500}>
							<RelatedExhibitions exhibitions={exhibition.relatedExhibitions!} />
						</FadeInView>
					)}
			</Animated.ScrollView>

			<ExhibitionDetailFloatingActions
				onBack={() => router.back()}
				onShare={handleShare}
				onBookmark={() => {
					if (!ensureAuth(`/(explore)/${id}`)) return;
					toggle(id);
				}}
				isBookmarked={isBookmarked}
				insetTop={insets.top}
			/>

			{/* 하단 CTA */}
			{exhibition.ticketUrl ? (
				<View className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100'>
					<SafeAreaView edges={['bottom']}>
						<ExhibitionTicketCTA ticketUrl={exhibition.ticketUrl} />
					</SafeAreaView>
				</View>
			) : null}

			<ImmersiveOverlay
				visible={immersiveOpen}
				exhibition={exhibition}
				onStart={() => {
					setImmersiveOpen(false);
					enterImmersive(id);
					recordVisit(todayKey(), id, {
						title: exhibition.title,
						venue: exhibition.venue,
					});
					setImmersiveMode(true);
					router.push('/(guide)/create-description');
				}}
				onClose={() => setImmersiveOpen(false)}
			/>
		</View>
	);
}
