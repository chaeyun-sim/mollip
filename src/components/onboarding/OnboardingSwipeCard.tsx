import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const ONBOARDING_CARD_HEIGHT = 500;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

const TEXT_SHADOW = {
	textShadowColor: 'rgba(0,0,0,0.5)',
	textShadowOffset: { width: 0, height: 1 },
	textShadowRadius: 6,
};

export interface OnboardingArtItem {
	id: string;
	mainGenre: string;
	subGenre: string;
	title: string;
	artist: string;
	color: string;
	accent: string;
	imageUrl: string;
}

interface OnboardingSwipeCardProps {
	item: OnboardingArtItem;
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	isTop: boolean;
	index: number;
	isPreviouslyLiked?: boolean;
}

export function OnboardingSwipeCard({
	item,
	onSwipeLeft,
	onSwipeRight,
	isTop,
	index,
	isPreviouslyLiked = false,
}: OnboardingSwipeCardProps) {
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);

	const gesture = Gesture.Pan()
		.enabled(isTop)
		.onUpdate((e) => {
			translateX.value = e.translationX;
			translateY.value = e.translationY * 0.12;
		})
		.onEnd((e) => {
			if (e.translationX > SWIPE_THRESHOLD) {
				translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 280 });
				runOnJS(onSwipeRight)();
			} else if (e.translationX < -SWIPE_THRESHOLD) {
				translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 280 });
				runOnJS(onSwipeLeft)();
			} else {
				translateX.value = withSpring(0, { damping: 15 });
				translateY.value = withSpring(0, { damping: 15 });
			}
		});

	const cardStyle = useAnimatedStyle(() => {
		const rotate = interpolate(
			translateX.value,
			[-SCREEN_WIDTH, 0, SCREEN_WIDTH],
			[-14, 0, 14],
		);
		const scale = isTop ? 1 : interpolate(index, [1, 2], [0.94, 0.88]);
		const yOffset = isTop ? translateY.value : index * -10;

		return {
			transform: [
				{ translateX: translateX.value },
				{ translateY: yOffset },
				{ rotate: `${rotate}deg` },
				{ scale },
			],
		};
	});

	const likeOverlay = useAnimatedStyle(() => ({
		opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 0.55]),
	}));

	const nopeOverlay = useAnimatedStyle(() => ({
		opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [0.55, 0]),
	}));

	const likeLabelStyle = useAnimatedStyle(() => ({
		opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.4], [0, 1]),
		transform: [{ rotate: '-12deg' }],
	}));

	const nopeLabelStyle = useAnimatedStyle(() => ({
		opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.4, 0], [1, 0]),
		transform: [{ rotate: '12deg' }],
	}));

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				className='absolute w-full rounded-3xl overflow-hidden'
				style={[
					{
						height: ONBOARDING_CARD_HEIGHT,
						backgroundColor: item.color,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.18,
						shadowRadius: 24,
						elevation: 10,
					},
					cardStyle,
				]}
			>
				{item.imageUrl ? (
					<Image
						source={{ uri: item.imageUrl }}
						resizeMode='cover'
						style={StyleSheet.absoluteFill}
					/>
				) : (
					<>
						{/* 상단 장식 (이미지 없는 항목용 플레이스홀더) */}
						<View
							className='absolute top-[-60px] right-[-40px] w-48 h-48 rounded-full opacity-20'
							style={{ backgroundColor: item.accent }}
						/>
						<View
							className='absolute top-16 left-[-30px] w-32 h-32 rounded-full opacity-10'
							style={{ backgroundColor: item.accent }}
						/>
					</>
				)}

				{/* 좋아요 오버레이 */}
				<Animated.View
					className='absolute inset-0 bg-emerald-400 rounded-3xl'
					style={likeOverlay}
				/>
				{/* 패스 오버레이 */}
				<Animated.View
					className='absolute inset-0 bg-rose-400 rounded-3xl'
					style={nopeOverlay}
				/>

				{/* SAVE 라벨 */}
				<Animated.View
					className='absolute top-10 left-6 border-[3px] border-emerald-500 rounded-xl px-4 py-1.5'
					style={likeLabelStyle}
				>
					<Text className='text-emerald-500 text-xl font-pretendard-bold tracking-widest'>
						LOVE
					</Text>
				</Animated.View>

				{/* PASS 라벨 */}
				<Animated.View
					className='absolute top-10 right-6 border-[3px] border-rose-500 rounded-xl px-4 py-1.5'
					style={nopeLabelStyle}
				>
					<Text className='text-rose-500 text-xl font-pretendard-bold tracking-widest'>
						PASS
					</Text>
				</Animated.View>

				{/* 이전 선택 배지 */}
				{isPreviouslyLiked && (
					<View
						className='absolute top-4 right-4 w-9 h-9 rounded-full items-center justify-center'
						style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
					>
						<Ionicons name='heart' size={18} color='#00bc7d' />
					</View>
				)}

				{/* 카드 콘텐츠 */}
				<View className='absolute bottom-0 left-0 right-0 px-6 pb-8 pt-24'>
					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
						locations={[0, 0.4, 1]}
						style={StyleSheet.absoluteFill}
					/>
					<View className='relative gap-2'>
						<View className='flex-row items-center gap-1.5'>
							<View className='bg-white/25 rounded-full px-2 py-0.5'>
								<Text
									className='text-white text-[10px] font-pretendard-semibold'
									style={TEXT_SHADOW}
								>
									{item.mainGenre}
								</Text>
							</View>
							<Text
								className='text-white/80 text-xs font-pretendard-medium tracking-[2px] uppercase'
								style={TEXT_SHADOW}
							>
								{item.subGenre}
							</Text>
						</View>
						<Text
							className='text-white text-[26px] leading-[32px] font-hahmlet-bold'
							style={TEXT_SHADOW}
						>
							{item.title}
						</Text>
						<Text
							className='text-white/70 text-[13px] font-pretendard-regular italic'
							style={TEXT_SHADOW}
						>
							{item.artist}
						</Text>
					</View>
				</View>
			</Animated.View>
		</GestureDetector>
	);
}
