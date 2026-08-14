import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
	ExhibitionDetailFloatingActions,
	ExhibitionImmersiveFab,
	ExhibitionInfoRow,
	ExhibitionMapPreview,
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
import { useShareExhibition } from '@/src/hooks/useShareExhibition';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { todayKey, useVisitStore } from '@/src/store/visitStore';
import { getExhibitionTypeDisplay } from '@/src/utils/exhibitionSearch';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cn } from '@/src/lib/cn';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;

const icons = {
	엘리베이터: 'elevator-passenger',
	전용주차: 'parking',
	휠체어: 'human-wheelchair',
	유모차: 'baby-carriage',
	수유실: 'mother-nurse',
	음성안내: 'headphones',
	오디오가이드: 'headphones',
	장애인화장실: 'toilet',
	전시해설: 'account-tie-voice',
	안내데스크: 'information-slab-circle',
} as const satisfies Record<
	string,
	React.ComponentProps<typeof MaterialCommunityIcons>['name']
>;

/** "YYYY.MM.DD" 문자열을 파싱해 오늘로부터 남은 일수를 반환. 이미 지났으면 음수. */
function getDaysRemaining(dateStr: string): number {
	const [y, m, d] = dateStr.split('.').map(Number);
	const end = new Date(y, m - 1, d);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

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
	const { handleShare } = useShareExhibition(exhibition ?? null);

	const fabBottom = insets.bottom + 20 + (exhibition?.ticketUrl ? 68 : 0);

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

	function renderAccessibility() {
		if (!exhibition?.accessibility) return null;
		const raw = exhibition.accessibility as string;

		if (!raw.length) return null;

		return (
			<View className='flex-row flex-wrap gap-1.5'>
				{raw.split(', ').map((item) => {
					const itemText = item.trim().split(' ').join('');
					const iconKey = Object.keys(icons).find((key) => itemText.startsWith(key));
					const iconName = iconKey
						? icons[iconKey as keyof typeof icons]
						: undefined;
					return (
						<View
							key={item}
							className='flex-row items-center rounded-full px-2.5 py-1 gap-1.5'
							style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}
						>
							{iconName && (
								<MaterialCommunityIcons name={iconName} size={13} color='#57534E' />
							)}
							{itemText.includes('경사로') && (
								<MaterialCommunityIcons
									name='wheelchair-accessibility'
									size={13}
									color='#57534E'
								/>
							)}
							{itemText.includes('주출입구단차없음') && (
								<MaterialCommunityIcons
									name={raw.includes('자동문') ? 'door-sliding-open' : 'door-open'}
									size={13}
									color='#57534E'
								/>
							)}
							{itemText.startsWith('점자') &&
								(itemText === '점자블록' ? (
									<MaterialCommunityIcons name='dots-grid' size={13} color='#57534E' />
								) : (
									<MaterialCommunityIcons name='braille' size={13} color='#57534E' />
								))}
							<Text className='text-[12px] font-pretendard-medium text-[#57534E]'>
								{item.trim()}
							</Text>
						</View>
					);
				})}
			</View>
		);
	}

	return (
		<View className='flex-1 bg-[#F8F6F2]'>
			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				bounces={false}
				contentContainerStyle={{ paddingBottom: fabBottom + 40 }}
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
							accessibilityLabel={`${exhibition.title} 전시 포스터`}
						/>
					</Animated.View>

					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.7)']}
						className='absolute bottom-0 left-0 right-0 h-[292px] justify-end pb-6 px-6'
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
							{(() => {
								const days = getDaysRemaining(exhibition.endDate);
								if (days > 14 || days < 0) return null;
								const label = days === 0 ? '오늘 마감' : `D-${days}`;
								const bg = days <= 3 ? '#EF4444' : days <= 7 ? '#F97316' : '#EAB308';
								return (
									<View
										className='px-2 py-0.5 rounded-full'
										style={{ backgroundColor: bg }}
									>
										<Text
											style={{
												fontFamily: 'Pretendard-SemiBold',
												fontSize: 11,
												color: 'white',
											}}
										>
											{label}
										</Text>
									</View>
								);
							})()}
							{(exhibition.web_site ?? exhibition.homepage_url) && (
								<Pressable
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										WebBrowser.openBrowserAsync(
											(exhibition.web_site ?? exhibition.homepage_url)!,
										);
									}}
									hitSlop={6}
									className='flex-row items-center gap-0.5'
									accessibilityRole='link'
									accessibilityLabel='공식 웹사이트 외부 브라우저에서 열기'
								>
									<Text className='text-[#1C1917] text-[13px] font-pretendard-medium'>
										공식 웹사이트
									</Text>
									<Ionicons name='open-outline' size={12} color='#1C1917' />
								</Pressable>
							)}
						</View>
					</View>
				</FadeInView>

				{exhibition.description && (
					<FadeInView delay={200}>
						<View className='px-6'>
							<Text
								className='font-pretendard-light text-[15px] leading-[26px] text-gray-600'
								numberOfLines={descriptionExpanded ? undefined : 3}
							>
								{exhibition.description}
							</Text>
							<Pressable
								onPress={() => setDescriptionExpanded((prev) => !prev)}
								className='mt-2'
								accessibilityRole='button'
								accessibilityLabel={descriptionExpanded ? '설명 접기' : '설명 더보기'}
							>
								<Text className='text-gray-400 text-[13px] font-pretendard-medium'>
									{descriptionExpanded ? '접기' : '더보기'}
								</Text>
							</Pressable>
						</View>
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
					<View
						className={cn(
							'px-6',
							exhibition.note || exhibition.tags || exhibition.description
								? 'pt-8'
								: 'pt-2',
						)}
					>
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

				{exhibition.accessibility && (
					<FadeInView delay={350}>
						<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4 px-6 mt-10'>
							접근성 정보
						</Text>
						<View className='px-6'>{renderAccessibility()}</View>
					</FadeInView>
				)}

				{exhibition.coordinates && (
					<FadeInView delay={350}>
						<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4 px-6 mt-10'>
							위치 정보
						</Text>
						<ExhibitionMapPreview
							coordinates={exhibition.coordinates}
							venueName={exhibition.venue}
						/>
					</FadeInView>
				)}

				{exhibition.relatedExhibitions &&
					exhibition.relatedExhibitions.length > 0 && (
						<FadeInView delay={500}>
							<RelatedExhibitions exhibitions={exhibition.relatedExhibitions} />
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
			{exhibition.ticketUrl && (
				<View className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100'>
					<SafeAreaView edges={['bottom']}>
						<ExhibitionTicketCTA ticketUrl={exhibition.ticketUrl} />
					</SafeAreaView>
				</View>
			)}

			{/* 몰입하기 FAB — 스크롤 위치 무관하게 항상 우하단에 고정.
			    CTA(예매하기)가 있으면 그 높이만큼 위로 올린다. */}
			<View className='absolute right-5' style={{ bottom: fabBottom }}>
				<ExhibitionImmersiveFab onPress={() => setImmersiveOpen(true)} />
			</View>

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
