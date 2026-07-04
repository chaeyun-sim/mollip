import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const CARD_HEIGHT = 500;

const EXHIBITIONS = [
	{
		id: '1',
		name: '모네, 빛을 그리다',
		artist: 'Claude Monet',
		venue: '예술의전당',
		dates: '2026.05.01 – 2026.08.31',
		color: '#D9C9A8',
		accent: '#B8935A',
	},
	{
		id: '2',
		name: '이중섭 특별전',
		artist: 'Lee Jung-seop',
		venue: '국립현대미술관',
		dates: '2026.04.10 – 2026.07.20',
		color: '#B8CCB4',
		accent: '#5A8A5E',
	},
	{
		id: '3',
		name: '달리 초현실주의',
		artist: 'Salvador Dalí',
		venue: '세종문화회관',
		dates: '2026.06.01 – 2026.09.15',
		color: '#B4B8CC',
		accent: '#5A5E8A',
	},
	{
		id: '4',
		name: '김환기 회고전',
		artist: 'Kim Whanki',
		venue: '환기미술관',
		dates: '2026.05.01 – 2026.09.30',
		color: '#C8B89A',
		accent: '#8A6A3A',
	},
	{
		id: '5',
		name: 'KAWS: HOLIDAY',
		artist: 'KAWS',
		venue: '롯데뮤지엄',
		dates: '2026.06.15 – 2026.10.01',
		color: '#A8C4A8',
		accent: '#3A6A3A',
	},
	{
		id: '6',
		name: '반 고흐: 별이 빛나는 밤',
		artist: 'Vincent van Gogh',
		venue: 'DDP 갤러리',
		dates: '2026.04.01 – 2026.08.15',
		color: '#B8B4C8',
		accent: '#5A3A8A',
	},
];

interface CardProps {
	item: (typeof EXHIBITIONS)[0];
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	isTop: boolean;
	index: number;
}

function SwipeCard({
	item,
	onSwipeLeft,
	onSwipeRight,
	isTop,
	index,
}: CardProps) {
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
						height: CARD_HEIGHT,
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
				{/* 상단 장식 */}
				<View
					className='absolute top-[-60px] right-[-40px] w-48 h-48 rounded-full opacity-20'
					style={{ backgroundColor: item.accent }}
				/>
				<View
					className='absolute top-16 left-[-30px] w-32 h-32 rounded-full opacity-10'
					style={{ backgroundColor: item.accent }}
				/>

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
						SAVE
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

				{/* 카드 콘텐츠 */}
				<View className='absolute bottom-0 left-0 right-0 px-6 pb-8 pt-16'>
					<View className='absolute bottom-0 left-0 right-0 top-0 rounded-b-3xl bg-black/42' />
					<View className='relative gap-2'>
						<Text className='text-white/60 text-xs font-pretendard-medium tracking-[3px] uppercase'>
							{item.venue}
						</Text>
						<Text className='text-white text-[26px] leading-[32px] font-hahmlet-bold'>
							{item.name}
						</Text>
						<Text className='text-white/50 text-[13px] font-pretendard-regular italic'>
							{item.artist}
						</Text>
						<View className='flex-row items-center gap-1.5 mt-1'>
							<Ionicons
								name='calendar-outline'
								size={12}
								color='rgba(255,255,255,0.45)'
							/>
							<Text className='text-white/45 text-xs font-pretendard-regular'>{item.dates}</Text>
						</View>
					</View>
				</View>
			</Animated.View>
		</GestureDetector>
	);
}

export default function OnboardingScreen() {
	const [cards, setCards] = useState(EXHIBITIONS);
	const [liked, setLiked] = useState<typeof EXHIBITIONS>([]);

	const handleSwipeLeft = useCallback(() => {
		setCards((prev) => prev.slice(1));
	}, []);

	const handleSwipeRight = useCallback(() => {
		setCards((prev) => {
			setLiked((l) => [...l, prev[0]]);
			return prev.slice(1);
		});
	}, []);

	const handleReset = useCallback(() => {
		setCards(EXHIBITIONS);
		setLiked([]);
	}, []);

	return (
		<SafeAreaView className='flex-1 bg-[#F8F6F2]' edges={['top']}>
			{/* 헤더 */}
			<View className='px-6 pt-4 pb-2 gap-1'>
				<Text className='text-gray-900 text-[26px] font-hahmlet-bold'>
					당신의 취향을{'\n'}골라보세요
				</Text>
				<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
					마음에 드는 전시를 저장하면 맞춤 추천을 드릴게요
				</Text>
			</View>

			{cards.length === 0 ? (
				<View className='flex-1 items-center justify-center gap-4 px-6'>
					<Text className='text-5xl'>🎨</Text>
					<Text className='text-gray-900 text-xl font-pretendard-bold'>완료!</Text>
					<Text className='text-gray-400 text-[13px] font-pretendard-regular text-center leading-5'>
						{liked.length > 0
							? `${liked.length}개의 전시 취향을 저장했어요\n맞춤 전시를 추천해드릴게요`
							: '다음에 취향을 설정해도 괜찮아요'}
					</Text>
					<View className='mt-2 bg-gray-900 rounded-2xl px-8 py-3.5'>
						<Text className='text-white font-pretendard-medium'>시작하기</Text>
					</View>
				</View>
			) : (
				<>
					{/* 진행 상태 */}
					<View className='flex-row gap-1.5 px-6 py-3'>
						{EXHIBITIONS.map((_, i) => (
							<View
								key={i}
								className={`h-1 flex-1 rounded-full ${
									i < EXHIBITIONS.length - cards.length ? 'bg-gray-900' : 'bg-gray-200'
								}`}
							/>
						))}
					</View>

					{/* 카드 스택 */}
					<View className='flex-1 items-center justify-center px-6'>
						<View className='w-full' style={{ height: CARD_HEIGHT }}>
							{cards
								.slice(0, 3)
								.reverse()
								.map((item, reversedIndex) => {
									const index = Math.min(
										cards.slice(0, 3).length - 1 - reversedIndex,
										2,
									);
									return (
										<SwipeCard
											key={item.id}
											item={item}
											index={index}
											isTop={index === 0}
											onSwipeLeft={handleSwipeLeft}
											onSwipeRight={handleSwipeRight}
										/>
									);
								})}
						</View>
					</View>

					{/* 하단 버튼 */}
					<View className='flex-row justify-center items-center gap-6 pb-6 pt-2'>
						<View className='items-center gap-1.5'>
							<View
								className='w-16 h-16 rounded-full bg-white items-center justify-center'
								style={{
									shadowColor: '#f43f5e',
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.2,
									shadowRadius: 12,
									elevation: 6,
								}}
							>
								<Ionicons name='close' size={28} color='#f43f5e' />
							</View>
							<Text className='text-gray-400 text-xs font-pretendard-regular'>패스</Text>
						</View>

						<View className='items-center gap-1.5'>
							<View
								className='w-20 h-20 rounded-full bg-gray-900 items-center justify-center'
								style={{
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 6 },
									shadowOpacity: 0.25,
									shadowRadius: 16,
									elevation: 8,
								}}
							>
								<Ionicons name='heart' size={30} color='#fff' />
							</View>
							<Text className='text-gray-400 text-xs font-pretendard-regular'>저장</Text>
						</View>

						<View className='items-center gap-1.5'>
							<View
								className='w-16 h-16 rounded-full bg-white items-center justify-center'
								style={{
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.08,
									shadowRadius: 12,
									elevation: 4,
								}}
							>
								<Ionicons name='bookmark-outline' size={24} color='#9CA3AF' />
							</View>
							<Text className='text-gray-400 text-xs font-pretendard-regular'>나중에</Text>
						</View>
					</View>
				</>
			)}
		</SafeAreaView>
	);
}
