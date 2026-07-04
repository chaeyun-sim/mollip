import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	Dimensions,
	Image,
	Linking,
	Pressable,
	ScrollView,
	Share,
	Text,
	View,
} from 'react-native';

const PAINTING_PLACEHOLDER = require('../../assets/images/example/painting-2.jpg');
import Animated, {
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import tinycolor from 'tinycolor2';

import {
	getExhibition,
	type Artwork,
	type Exhibition,
} from '@/src/data/exhibitions';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { cn } from '@/src/lib/cn';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;
const POSTER_W = 148;
const POSTER_H = 216;

function FadeInView({
	children,
	delay = 0,
}: {
	children: React.ReactNode;
	delay?: number;
}) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(24);

	useEffect(() => {
		opacity.value = withDelay(delay, withTiming(1, { duration: 450 }));
		translateY.value = withDelay(
			delay,
			withSpring(0, { damping: 18, stiffness: 120 }),
		);
	}, []);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return <Animated.View style={style}>{children}</Animated.View>;
}

export default function ExhibitionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [descriptionExpanded, setDescriptionExpanded] = useState(false);

	const exhibition = getExhibition(id);
	const isBookmarked = useBookmarkStore((s) => s.isBookmarked(id));
	const toggle = useBookmarkStore((s) => s.toggle);

	const palette = exhibition
		? (() => {
				const base = tinycolor(exhibition.posterColor);
				const isDark = base.isDark();
				return {
					pillText: base
						.clone()
						.darken(isDark ? 10 : 40)
						.desaturate(5)
						.toHexString(),
					tagBg: base
						.clone()
						.lighten(isDark ? 50 : 32)
						.desaturate(25)
						.toHexString(),
				};
			})()
		: null;

	const scrollY = useSharedValue(0);
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	const heroImageStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: scrollY.value * 0.35 }],
	}));

	const backScale = useSharedValue(1);
	const backAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: backScale.value }],
	}));

	const bookmarkScale = useSharedValue(1);
	const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: bookmarkScale.value }],
	}));

	const shareScale = useSharedValue(1);
	const shareAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: shareScale.value }],
	}));

	const handleShare = async () => {
		try {
			await Share.share({
				message: `${exhibition?.title} @ ${exhibition?.venue}\n${exhibition?.startDate} – ${exhibition?.endDate}`,
				title: exhibition?.title,
			});
		} catch {
			// share cancelled
		}
	};

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
				{/* Hero Section */}
				<View className='overflow-hidden w-full' style={{ height: HERO_HEIGHT }}>
					<Animated.View
						style={[{ width: '100%', height: HERO_HEIGHT }, heroImageStyle]}
					>
						<Image
							source={require('../../assets/images/example/exhibition-1.png')}
							className='w-full h-full'
							resizeMode='cover'
						/>
					</Animated.View>

					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.7)']}
						className='absolute bottom-0 left-0 right-0 h-[292px] justify-end pb-6 px-6'
					/>

					<View className='absolute bottom-6 right-6'>
						<ImmersiveButton exhibition={exhibition} />
					</View>
				</View>

				{/* Meta Info */}
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
						<MetaPill icon='location-outline' text={exhibition.venue} />
						{exhibition.artist && (
							<MetaPill icon='person-outline' text={exhibition.artist} />
						)}
					</ScrollView>
				</FadeInView>

				{/* 전시 제목 */}
				<FadeInView delay={170}>
					<View className='px-6 pt-1 pb-3'>
						<Text className='text-gray-900 text-[26px] leading-[34px] font-pretendard-bold'>
							{exhibition.title}
						</Text>
						<Text className='text-gray-400 text-[13px] font-pretendard-regular mt-1'>
							{exhibition.startDate} – {exhibition.endDate}
						</Text>
					</View>
				</FadeInView>

				{/* Description */}
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
						>
							<Text className='text-gray-400 text-[13px] font-pretendard-medium'>
								{descriptionExpanded ? '접기' : '더보기'}
							</Text>
						</Pressable>
					</View>
				</FadeInView>

				{/* 태그 (큐레이터 노트 없을 때만) */}
				{!exhibition.curatorNote &&
					exhibition.tags &&
					exhibition.tags.length > 0 && (
						<FadeInView delay={260}>
							<View className='px-6 pt-8'>
								<View className='flex-row flex-wrap gap-2'>
									{exhibition.tags.map((tag) => (
										<View
											key={tag}
											className='rounded-full px-3 py-1.5'
											style={{ backgroundColor: palette?.tagBg ?? '#F2EFE9' }}
										>
											<Text
												className='text-[12px] font-pretendard-medium'
												style={{ color: palette?.pillText ?? '#6B7280' }}
											>
												# {tag}
											</Text>
										</View>
									))}
								</View>
							</View>
						</FadeInView>
					)}

				{/* 큐레이터 노트 */}
				{exhibition.curatorNote && (
					<FadeInView delay={260}>
						<View className='px-6 pt-8'>
							<View className='flex-row items-center gap-2 mb-3'>
								<Ionicons name='ribbon-outline' size={15} color='#9CA3AF' />
								<Text className='font-pretendard-semibold text-[13px] text-gray-400 tracking-widest uppercase'>
									큐레이터 노트
								</Text>
							</View>
							<View className='rounded-2xl p-5 bg-[#F2EFE9]'>
								<Text className='font-pretendard-light text-[14px] leading-[24px] text-gray-600 italic'>
									"{exhibition.curatorNote}"
								</Text>
								{exhibition.curator && (
									<Text className='font-pretendard-medium text-[12px] text-gray-400 mt-3 text-right'>
										— {exhibition.curator}
									</Text>
								)}
								{exhibition.tags && exhibition.tags.length > 0 && (
									<View className='flex-row flex-wrap gap-2 mt-4 pt-4 border-t-[1px] border-t-black/6'>
										{exhibition.tags.map((tag) => (
											<View
												key={tag}
												className='rounded-full px-3 py-1'
												style={{ backgroundColor: palette?.tagBg ?? '#E8E4DC' }}
											>
												<Text
													className='text-[11px] font-pretendard-medium'
													style={{ color: palette?.pillText ?? '#6B7280' }}
												>
													# {tag}
												</Text>
											</View>
										))}
									</View>
								)}
							</View>
						</View>
					</FadeInView>
				)}

				{/* 관람 정보 */}
				<FadeInView delay={300}>
					<View className='px-6 pt-8'>
						<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
							관람 정보
						</Text>
						<View className='rounded-3xl overflow-hidden border border-[#1C1917]'>
							<View className='flex-row'>
								<View className='px-5 pt-5 pb-5 w-1/2 bg-[#EDEAE4] border-b-[1px] border-b-[#1C1917]'>
									<Text className='text-gray-500 text-[10px] font-pretendard-medium tracking-widest uppercase mb-1.5'>
										운영시간
									</Text>
									<Text className='text-gray-900 text-[14px] font-hahmlet-bold leading-5'>
										{exhibition.openHours}
									</Text>
									{exhibition.closedDays && (
										<Text className='text-gray-400 text-[11px] font-pretendard-regular mt-1'>
											{exhibition.closedDays} 휴관
										</Text>
									)}
								</View>
								<View className='px-5 pt-5 pb-5 w-1/2 border-b-[1px] border-b-[#1C1917]'>
									<Text className='text-gray-500 text-[10px] font-pretendard-medium tracking-widest uppercase mb-1.5'>
										관람료
									</Text>
									<Text className='text-gray-900 text-[14px] font-pretendard-bold'>
										{exhibition.admission}
									</Text>
									{exhibition.admissionFree && (
										<View className='mt-1 self-start bg-emerald-50 rounded-full px-2 py-0.5'>
											<Text className='text-emerald-600 text-[10px] font-pretendard-medium'>
												무료
											</Text>
										</View>
									)}
								</View>
							</View>
							<View className='flex-row'>
								<View className='px-5 pt-5 pb-5 w-full bg-[#EDEAE4]'>
									<Text className='text-gray-500 text-[10px] font-pretendard-medium tracking-widest uppercase mb-1.5'>
										전시 기간
									</Text>
									<Text className='text-gray-900 text-[13px] font-pretendard-semibold leading-5'>
										{exhibition.startDate}
										{'\n'}– {exhibition.endDate}
									</Text>
								</View>
								<View className='px-5 pt-5 pb-5 w-1/2'>
									<Text className='text-gray-500 text-[10px] font-pretendard-medium tracking-widest uppercase mb-1.5'>
										위치
									</Text>
									<Text
										className='text-gray-900 text-[13px] font-pretendard-semibold leading-5'
										numberOfLines={2}
									>
										{exhibition.venue}
									</Text>
									{exhibition.venueAddress && (
										<Text
											className='text-gray-400 text-[11px] font-pretendard-regular mt-0.5'
											numberOfLines={2}
										>
											{exhibition.venueAddress}
										</Text>
									)}
								</View>
							</View>
						</View>
					</View>
				</FadeInView>

				{/* 관련 추천 작품 */}
				{exhibition.artworks.length > 0 && (
					<FadeInView delay={400}>
						<View className='px-6 pt-8'>
							<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
								관련 추천 작품
							</Text>
							<View className='flex-row flex-wrap justify-between gap-y-4'>
								{exhibition.artworks.slice(0, 4).map((artwork) => (
									<ArtworkCard
										key={artwork.id}
										artwork={artwork}
										onPress={() => router.push(`/(explore)/artwork/${artwork.id}`)}
									/>
								))}
							</View>
						</View>
					</FadeInView>
				)}

				{/* 추천 전시 */}
				{exhibition.relatedExhibitionIds.length > 0 && (
					<FadeInView delay={500}>
						<RelatedExhibitions ids={exhibition.relatedExhibitionIds} />
					</FadeInView>
				)}
			</Animated.ScrollView>

			{/* 뒤로가기 버튼 */}
			<Pressable
				onPressIn={() => {
					backScale.value = withTiming(0.92, { duration: 100 });
				}}
				onPressOut={() => {
					backScale.value = withTiming(1, { duration: 150 });
				}}
				onPress={() => router.back()}
				className='absolute left-5'
				style={{ top: insets.top + 16 }}
				accessibilityLabel='뒤로가기'
				accessibilityRole='button'
				hitSlop={8}
			>
				<Animated.View
					style={backAnimatedStyle}
					className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
				>
					<Ionicons name='chevron-back' size={22} color='#1a1a1a' />
				</Animated.View>
			</Pressable>

			{/* 우측 상단 버튼 그룹 (공유 + 북마크) */}
			<View
				className='absolute right-5 flex-row gap-2'
				style={{ top: insets.top + 16 }}
			>
				{/* 공유 버튼 */}
				<Pressable
					onPressIn={() => {
						shareScale.value = withTiming(0.92, { duration: 100 });
					}}
					onPressOut={() => {
						shareScale.value = withTiming(1, { duration: 150 });
					}}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						handleShare();
					}}
					accessibilityLabel='공유하기'
					accessibilityRole='button'
					hitSlop={8}
				>
					<Animated.View
						style={shareAnimatedStyle}
						className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
					>
						<Ionicons name='share-outline' size={20} color='#1a1a1a' />
					</Animated.View>
				</Pressable>

				{/* 북마크 버튼 */}
				<Pressable
					onPressIn={() => {
						bookmarkScale.value = withTiming(0.92, { duration: 100 });
					}}
					onPressOut={() => {
						bookmarkScale.value = withTiming(1, { duration: 150 });
					}}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						toggle(id);
					}}
					accessibilityLabel='북마크'
					accessibilityRole='button'
					hitSlop={8}
				>
					<Animated.View
						style={bookmarkAnimatedStyle}
						className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
					>
						<Ionicons
							name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
							size={20}
							color={isBookmarked ? '#111827' : '#1a1a1a'}
						/>
					</Animated.View>
				</Pressable>
			</View>

			{/* 하단 CTA */}
			<View className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100'>
				<SafeAreaView edges={['bottom']}>
					<CTAButton exhibition={exhibition} />
				</SafeAreaView>
			</View>
		</View>
	);
}

function CTAButton({ exhibition }: { exhibition: Exhibition }) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const hasTicket = !!exhibition.ticketUrl;

	return (
		<Pressable
			onPressIn={() => {
				if (!hasTicket) return;
				scale.value = withTiming(0.97, { duration: 100 });
			}}
			onPressOut={() => {
				scale.value = withTiming(1, { duration: 150 });
			}}
			onPress={() => {
				if (!hasTicket) return;
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				Linking.openURL(exhibition.ticketUrl!);
			}}
			accessibilityLabel={hasTicket ? '예매하러 가기' : '예매 정보 없음'}
			accessibilityRole='button'
			disabled={!hasTicket}
		>
			<Animated.View
				style={[
					animatedStyle,
					{ backgroundColor: hasTicket ? '#111827' : '#D1D5DB' },
				]}
				className='mx-5 my-3 rounded-2xl py-[18px] flex-row items-center justify-center gap-2.5'
			>
				<Ionicons
					name='ticket-outline'
					size={20}
					color={hasTicket ? 'white' : '#9CA3AF'}
				/>
				<Text
					className={cn(
						'font-pretendard-bold text-[16px]',
						hasTicket ? 'text-white' : 'text-[#9CA3AF]',
					)}
				>
					{hasTicket ? '예매하러 가기' : '예매 정보 없음'}
				</Text>
				{hasTicket && (
					<Ionicons name='chevron-forward' size={16} color='rgba(255,255,255,0.5)' />
				)}
			</Animated.View>
		</Pressable>
	);
}

function ImmersiveButton({ exhibition }: { exhibition: Exhibition }) {
	const router = useRouter();
	const pressScale = useSharedValue(1);
	const pressStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScale.value }],
	}));

	return (
		<Pressable
			onPressIn={() => {
				pressScale.value = withSpring(0.88, { damping: 12 });
			}}
			onPressOut={() => {
				pressScale.value = withSpring(1, { damping: 12 });
			}}
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				router.push(`/(guide)/immersive/${exhibition.id}`);
			}}
			accessibilityLabel='몰입하기'
			accessibilityRole='button'
			hitSlop={8}
		>
			<Animated.View style={pressStyle} className='items-center'>
				<View className='w-14 h-14 rounded-full items-center justify-center bg-white/18 border-[1.5px] border-white/45'>
					<Ionicons name='headset' size={24} color='white' />
				</View>
				<Text className='text-white/70 text-[10px] font-pretendard-medium text-center mt-1.5'>
					몰입하기
				</Text>
			</Animated.View>
		</Pressable>
	);
}

function MetaPill({
	icon,
	text,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	text: string;
}) {
	return (
		<View className='flex-row items-center gap-1.5 rounded-full px-3 py-2 bg-white'>
			<Ionicons name={icon} size={14} color='#6B7280' />
			<Text className='font-pretendard-regular text-[12px] text-[#374151]'>{text}</Text>
		</View>
	);
}

function ArtworkCard({
	artwork,
	onPress,
}: {
	artwork: Artwork;
	onPress: () => void;
}) {
	const cardSize = (SCREEN_WIDTH - 48 - 12) / 2;
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withSpring(0.96, { damping: 15 });
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 15 });
			}}
			onPress={onPress}
			style={{ width: cardSize }}
		>
			<Animated.View style={animatedStyle}>
				<Image
					source={artwork.imageSource ?? PAINTING_PLACEHOLDER}
					style={{ height: cardSize, width: cardSize }}
					className='rounded-[16px]'
					resizeMode='cover'
				/>
				<View className='pt-2'>
					<Text
						className='font-pretendard-medium text-[13px] text-gray-800'
						numberOfLines={1}
					>
						{artwork.title}
					</Text>
					<Text className='font-pretendard-regular text-[11px] text-gray-400 mt-0.5'>
						{artwork.artist}
						{artwork.year ? ` · ${artwork.year}` : ''}
					</Text>
				</View>
			</Animated.View>
		</Pressable>
	);
}

function RelatedExhibitions({ ids }: { ids: string[] }) {
	const router = useRouter();
	const related = ids
		.map((relId) => getExhibition(relId))
		.filter((e): e is Exhibition => e !== undefined)
		.slice(0, 2);

	if (related.length === 0) return null;

	return (
		<View className='pt-8 px-6'>
			<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
				추천 전시
			</Text>
			<View className='gap-3'>
				{related.map((ex) => (
					<RelatedExhibitionCard
						key={ex.id}
						exhibition={ex}
						onPress={() => router.push(`/(explore)/${ex.id}`)}
					/>
				))}
			</View>
		</View>
	);
}

function RelatedExhibitionCard({
	exhibition,
	onPress,
}: {
	exhibition: Exhibition;
	onPress: () => void;
}) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withSpring(0.97, { damping: 15 });
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 15 });
			}}
			onPress={onPress}
			accessibilityLabel={`${exhibition.title}, ${exhibition.venue}`}
			accessibilityRole='button'
		>
			<Animated.View
				style={animatedStyle}
				className='flex-row items-center gap-4 bg-[#F2EFE9] rounded-2xl p-4'
			>
				{/* 포스터 컬러 썸네일 */}
				<View
					style={{ backgroundColor: exhibition.posterColor }}
					className='w-16 h-16 rounded-xl flex-shrink-0'
				/>

				{/* 텍스트 */}
				<View className='flex-1'>
					<Text
						className='font-pretendard-semibold text-[15px] text-gray-900 leading-[21px]'
						numberOfLines={2}
					>
						{exhibition.title}
					</Text>
					<Text className='font-pretendard-regular text-[12px] text-gray-400 mt-1'>
						{exhibition.venue}
					</Text>
					<Text className='font-pretendard-regular text-[11px] text-gray-300 mt-0.5'>
						{exhibition.endDate}까지
					</Text>
				</View>

				<Ionicons name='chevron-forward' size={16} color='#D1D5DB' />
			</Animated.View>
		</Pressable>
	);
}
