import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const CARD_HEIGHT = 500;

const TEXT_SHADOW = {
	textShadowColor: 'rgba(0,0,0,0.5)',
	textShadowOffset: { width: 0, height: 1 },
	textShadowRadius: 6,
};

// 12개 하드코딩 — 6개씩 두 배치, 배치마다 한국화1·회화2·공예1·조각1·현대미술1 비율 유지
const ART_ITEMS = [
	{
		id: '1',
		mainGenre: '한국화',
		subGenre: '수묵화',
		title: '인왕제색도',
		artist: '정선',
		color: '#D9C9A8',
		accent: '#B8935A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Inwangjesaekdo.jpg/3840px-Inwangjesaekdo.jpg',
	},
	{
		id: '2',
		mainGenre: '회화',
		subGenre: '풍경화',
		title: '별이 빛나는 밤',
		artist: '빈센트 반 고흐',
		color: '#B8B4C8',
		accent: '#5A3A8A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/3840px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
	},
	{
		id: '3',
		mainGenre: '회화',
		subGenre: '인물화',
		title: '키스',
		artist: '구스타프 클림트',
		color: '#C8C8CC',
		accent: '#5A5A6A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/3840px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
	},
	{
		id: '4',
		mainGenre: '공예',
		subGenre: '도자공예',
		title: '달항아리',
		artist: '작가 미상',
		color: '#E0DCD0',
		accent: '#B0A488',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/1/19/%EB%B0%B1%EC%9E%90_%EB%8B%AC%ED%95%AD%EC%95%84%EB%A6%AC%28309%ED%98%B8%29.jpg',
	},
	{
		id: '5',
		mainGenre: '조각',
		subGenre: '인물조각',
		title: '생각하는 사람',
		artist: '오귀스트 로댕',
		color: '#C4C0B4',
		accent: '#6A6250',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/a/a4/Le_Penseur_by_Rodin_%28Kunsthalle_Bielefeld%29_2014-04-10.JPG',
	},
	{
		id: '6',
		mainGenre: '현대미술',
		subGenre: '모더니즘',
		title: '지저귀는 기계',
		artist: '파울 클레',
		color: '#A8C4A8',
		accent: '#3A6A3A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/7/7e/Die_Zwitscher-Maschine_%28Twittering_Machine%29%2C_1922_-_Paul_Klee.jpg',
	},
	{
		id: '7',
		mainGenre: '한국화',
		subGenre: '진경산수화',
		title: '금강전도',
		artist: '정선',
		color: '#B4C8CC',
		accent: '#3A6A7A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Geumgangjeondo.jpg/3840px-Geumgangjeondo.jpg',
	},
	{
		id: '8',
		mainGenre: '회화',
		subGenre: '정물화',
		title: '사과와 오렌지',
		artist: '폴 세잔',
		color: '#CCC0A8',
		accent: '#8A7A3A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nature_morte_aux_pommes_et_aux_oranges%2C_par_Paul_C%C3%A9zanne.jpg',
	},
	{
		id: '9',
		mainGenre: '회화',
		subGenre: '초상화',
		title: '진주 귀걸이를 한 소녀',
		artist: '요하네스 페르메이르',
		color: '#CCB8C0',
		accent: '#7A3A5A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/3840px-1665_Girl_with_a_Pearl_Earring.jpg',
	},
	{
		id: '10',
		mainGenre: '공예',
		subGenre: '청자공예',
		title: '청자 향로',
		artist: '작가 미상',
		color: '#B4CCC4',
		accent: '#3A7A6A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/5/52/Korea_-_Seoul_-_National_Museum_-_Incense_Burner_0252-06a.jpg',
	},
	{
		id: '11',
		mainGenre: '조각',
		subGenre: '인물조각',
		title: '다비드상',
		artist: '미켈란젤로',
		color: '#D4CCC0',
		accent: '#8A7A6A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/b/bb/%27David%27_by_Michelangelo_Fir_JBU004.jpg',
	},
	{
		id: '12',
		mainGenre: '현대미술',
		subGenre: '미래주의',
		title: '공간 속에서 연속되는 유일한 형태들',
		artist: '움베르토 보치오니',
		color: '#A8B4C4',
		accent: '#3A5E8A',
		imageUrl:
			'https://upload.wikimedia.org/wikipedia/commons/f/fd/%27Unique_Forms_of_Continuity_in_Space%27%2C_1913_bronze_by_Umberto_Boccioni.jpg',
	},
];

function shuffle<T>(items: T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

interface CardProps {
	item: (typeof ART_ITEMS)[0];
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

export default function OnboardingScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const [cards, setCards] = useState(() => shuffle(ART_ITEMS));
	const [liked, setLiked] = useState<typeof ART_ITEMS>([]);

	const totalSwiped = ART_ITEMS.length - cards.length;

	const handleComplete = useCallback(async () => {
		// 온보딩 작업중 — 완료 플래그 저장 임시 주석처리
		// if (userId) {
		// 	await supabase
		// 		.from('profiles')
		// 		.update({ onboarding_completed: true })
		// 		.eq('id', userId);
		// }
		router.replace('/(tabs)');
	}, [router, userId]);

	const handleSwipeLeft = useCallback(() => {
		setCards((prev) => prev.slice(1));
	}, []);

	const handleSwipeRight = useCallback(() => {
		setCards((prev) => {
			setLiked((l) => [...l, prev[0]]);
			return prev.slice(1);
		});
	}, []);

	return (
		<SafeAreaView className='flex-1 bg-[#F8F6F2]' edges={['top']}>
			{/* 헤더 */}
			<View className='px-6 pt-4 pb-2 gap-1'>
				<Text className='text-gray-900 text-[26px] font-hahmlet-bold'>
					당신의 취향을{'\n'}골라보세요
				</Text>
				<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
					마음에 드는 그림을 저장하면 맞춤 전시를 추천해드릴게요
				</Text>
			</View>

			{cards.length === 0 ? (
				<View className='flex-1 items-center justify-center gap-4 px-6'>
					<Text className='text-5xl'>🎨</Text>
					<Text className='text-gray-900 text-xl font-pretendard-bold'>완료!</Text>
					<Text className='text-gray-400 text-[13px] font-pretendard-regular text-center leading-5'>
						{liked.length > 0
							? `${liked.length}개의 취향을 저장했어요\n맞춤 전시를 추천해드릴게요`
							: '다음에 취향을 설정해도 괜찮아요'}
					</Text>
					<Pressable
						onPress={handleComplete}
						accessibilityRole='button'
						accessibilityLabel='시작하기'
						className='mt-2 bg-gray-900 rounded-2xl px-8 py-3.5'
					>
						<Text className='text-white font-pretendard-medium'>시작하기</Text>
					</Pressable>
				</View>
			) : (
				<>
					{/* 진행 상태 */}
					<View className='flex-row gap-1.5 px-6 py-3'>
						{ART_ITEMS.map((_, i) => (
							<View
								key={i}
								className={`h-1 flex-1 rounded-full ${
									i < totalSwiped ? 'bg-gray-900' : 'bg-gray-200'
								}`}
							/>
						))}
					</View>

					{/* 카드 스택 */}
					<View className='flex-1 items-center pt-6 px-6'>
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
					<View className='flex-row justify-center items-center gap-6 pb-10 pt-2'>
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
								className='w-16 h-16 rounded-full bg-white items-center justify-center'
								style={{
									shadowColor: '##00bc7d',
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.08,
									shadowRadius: 12,
									elevation: 4,
								}}
							>
								<Ionicons name='heart' size={30} color='#00bc7d' />
							</View>
							<Text className='text-gray-400 text-xs font-pretendard-regular'>선택!</Text>
						</View>
					</View>
				</>
			)}
		</SafeAreaView>
	);
}
