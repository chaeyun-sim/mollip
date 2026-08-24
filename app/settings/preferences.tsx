import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import {
	OnboardingSwipeCard,
	ONBOARDING_CARD_HEIGHT,
	type OnboardingArtItem,
} from '@/src/components/onboarding/OnboardingSwipeCard';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';
import { colors } from '@/src/constants/colors';

const ART_ITEMS: OnboardingArtItem[] = [
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

export default function PreferencesScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const [isLoading, setIsLoading] = useState(true);
	const [currentArtists, setCurrentArtists] = useState<string[]>([]);
	const [cards, setCards] = useState<OnboardingArtItem[]>([]);
	const [liked, setLiked] = useState<OnboardingArtItem[]>([]);
	const [done, setDone] = useState(false);
	const [saving, setSaving] = useState(false);

	// 기존 취향 표시용으로만 로드 — 카드 덱은 항상 전체 12장 (취소도 가능하도록)
	useEffect(() => {
		async function loadExisting() {
			if (userId) {
				const { data } = await supabase
					.from('profiles')
					.select('preferred_artists')
					.eq('id', userId)
					.single();
				setCurrentArtists(data?.preferred_artists ?? []);
			}
			setCards(shuffle(ART_ITEMS));
			setIsLoading(false);
		}
		void loadExisting();
	}, [userId]);

	const totalSwiped = ART_ITEMS.length - cards.length;

	const handleSwipeLeft = useCallback(() => {
		setCards((prev) => {
			const next = prev.slice(1);
			if (next.length === 0) setDone(true);
			return next;
		});
	}, []);

	const handleSwipeRight = useCallback(() => {
		setCards((prev) => {
			setLiked((l) => [...l, prev[0]]);
			const next = prev.slice(1);
			if (next.length === 0) setDone(true);
			return next;
		});
	}, []);

	const handleSave = useCallback(async () => {
		if (saving) return;
		setSaving(true);
		if (userId) {
			const genres = [
				...new Set(
					liked.flatMap((item) =>
						[item.mainGenre, item.subGenre].filter((g): g is string => Boolean(g)),
					),
				),
			];
			const artists = [
				...new Set(
					liked
						.map((item) => item.artist)
						.filter((a): a is string => Boolean(a?.trim())),
				),
			];
			await supabase
				.from('profiles')
				.update({ preferred_genres: genres, preferred_artists: artists })
				.eq('id', userId);
		}
		router.back();
	}, [router, userId, liked, saving]);

	return (
		<Screen variant='warm'>
			<LinearGradient
				colors={['#FFF3E6', '#F7DFCE', '#E4CCE8', colors.bgLight]}
				locations={[0, 0.32, 0.68, 1]}
				style={StyleSheet.absoluteFill}
			/>

			<Screen.Header>
				<Screen.Header.Back color={colors.primary} onPress={() => router.back()} />
				<Screen.Header.Center>
					<Text className='font-pretendard-semibold text-[16px] text-primary'>
						내 취향 수정
					</Text>
				</Screen.Header.Center>
			</Screen.Header>

			{isLoading ? (
				<View className='flex-1 items-center justify-center'>
					<ActivityIndicator color={colors.primary} />
				</View>
			) : done ? (
				<>
					<View className='flex-1 items-center justify-center gap-4'>
						<Text className='text-5xl'>🎨</Text>
						<Text className='text-primary text-xl font-pretendard-bold'>완료!</Text>
						<Text className='text-[#6B6360] text-[13px] font-pretendard-regular text-center leading-5'>
							{liked.length > 0
								? `${liked.length}개의 취향을 저장했어요\n맞춤 전시를 추천해드릴게요`
								: '다음에 취향을 설정해도 괜찮아요'}
						</Text>
					</View>
					<Screen.Bottom className='pb-12'>
						<Pressable
							className='w-full bg-primary flex-row items-center justify-center rounded-[18px] py-[18px] gap-2.5 border-[0.5px] border-white/25'
							style={({ pressed }) => ({ opacity: pressed || saving ? 0.6 : 1 })}
							onPress={handleSave}
							accessibilityRole='button'
							accessibilityLabel='저장하기'
						>
							<Text className='text-[16px] text-white font-pretendard-semibold'>
								저장하기
							</Text>
						</Pressable>
					</Screen.Bottom>
				</>
			) : (
				<>
					{/* 부제 */}
					<Text className='text-[13px] font-pretendard-regular text-[#6B6360] mb-1'>
						마음에 드는 그림을 저장하면 맞춤 전시를 추천해드릴게요
					</Text>

					{/* 진행 상태 */}
					<View className='flex-row gap-1.5 px-6 py-3'>
						{ART_ITEMS.map((_, i) => (
							<View
								key={i}
								className={`h-1 flex-1 rounded-full ${
									i < totalSwiped ? 'bg-primary' : 'bg-divider'
								}`}
							/>
						))}
					</View>

					{/* 카드 스택 */}
					<View className='flex-1 items-center pt-6 px-6'>
						<View className='w-full' style={{ height: ONBOARDING_CARD_HEIGHT }}>
							{cards
								.slice(0, 3)
								.reverse()
								.map((item, reversedIndex) => {
									const index = Math.min(
										cards.slice(0, 3).length - 1 - reversedIndex,
										2,
									);
									return (
										<OnboardingSwipeCard
											key={item.id}
											item={item}
											index={index}
											isTop={index === 0}
											onSwipeLeft={handleSwipeLeft}
											onSwipeRight={handleSwipeRight}
											isPreviouslyLiked={currentArtists.includes(item.artist)}
										/>
									);
								})}
						</View>
					</View>

					{/* 하단 버튼 */}
					<View className='flex-row justify-center items-center gap-6 pb-10 pt-2'>
						<Pressable
							onPress={handleSwipeLeft}
							accessibilityRole='button'
							accessibilityLabel='패스'
							className='items-center gap-1.5'
						>
							<View
								className='w-16 h-16 rounded-full bg-white items-center justify-center'
								style={{
									shadowColor: colors.errorAlt,
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.2,
									shadowRadius: 12,
									elevation: 6,
								}}
							>
								<Ionicons name='close' size={28} color={colors.errorAlt} />
							</View>
							<Text className='text-[#6B6360] text-xs font-pretendard-regular'>
								패스
							</Text>
						</Pressable>

						<Pressable
							onPress={handleSwipeRight}
							accessibilityRole='button'
							accessibilityLabel='선택'
							className='items-center gap-1.5'
						>
							<View
								className='w-16 h-16 rounded-full bg-white items-center justify-center'
								style={{
									shadowColor: colors.success,
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.08,
									shadowRadius: 12,
									elevation: 4,
								}}
							>
								<Ionicons name='heart' size={30} color={colors.success} />
							</View>
							<Text className='text-[#6B6360] text-xs font-pretendard-regular'>
								선택!
							</Text>
						</Pressable>
					</View>
				</>
			)}
		</Screen>
	);
}
