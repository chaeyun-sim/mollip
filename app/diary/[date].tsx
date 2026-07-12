import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridPaper } from '@/src/components/archive/GridPaper';
import { PlaylistModal } from '@/src/components/archive/PlaylistModal';
import { Polaroid } from '@/src/components/archive/Polaroid';
import { WashiTape } from '@/src/components/archive/WashiTape';
import { useDiaryEntry } from '@/src/hooks/useDiaryEntry';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { DIARY_PROMPT } from '@/src/constants/prompts';
import { EXHIBITIONS } from '@/src/data/exhibitions';

const HAND = { fontFamily: 'NanumPenScript_400Regular' } as const;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default function DiaryScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ date?: string }>();

	// 파라미터가 없거나 형식이 어긋나면 오늘 날짜로 대체
	const dateKey = useMemo(() => {
		const raw = typeof params.date === 'string' ? params.date : '';
		return /^\d{4}-\d{2}-\d{2}$/.test(raw)
			? raw
			: new Date().toISOString().slice(0, 10);
	}, [params.date]);

	const dateLabel = useMemo(() => {
		const [y, m, d] = dateKey.split('-').map(Number);
		const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
		return `${y}.${m}.${d} ${weekday}요일`;
	}, [dateKey]);

	// 관람 기록: 최근 관람 전시(데모: 첫 전시) + 들은 오디오 해설(플레이리스트)
	const exhibition = EXHIBITIONS[0];
	const playlist = useImmersiveStore((s) => s.playlist);
	const [playlistVisible, setPlaylistVisible] = useState(false);

	const listenedTitles = useMemo(
		() =>
			playlist.length > 0
				? playlist.map((p) => p.title)
				: exhibition.artworks.slice(0, 3).map((a) => a.title),
		[playlist, exhibition],
	);

	const prompt = useMemo(
		() =>
			DIARY_PROMPT({
				date: dateLabel,
				exhibitionTitle: exhibition.title,
				venue: exhibition.venue,
				artworkTitles: listenedTitles,
			}),
		[dateLabel, exhibition, listenedTitles],
	);

	const { text, hasEntry, isStreaming, hasError, generate } = useDiaryEntry(
		dateKey,
		{ prompt },
	);

	return (
		<SafeAreaView className='flex-1' style={{ backgroundColor: '#C4CFD3' }} edges={['top']}>
			{/* 헤더 */}
			<View className='flex-row items-center justify-between px-6 py-3'>
				<Pressable
					onPress={() => router.back()}
					hitSlop={8}
					accessibilityLabel='뒤로 가기'
					accessibilityRole='button'
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
				>
					<Ionicons name='arrow-back' size={22} color='#37342F' />
				</Pressable>
				<Text
					className='text-[17px] text-[#37342F]'
					style={{ fontFamily: 'Pretendard-SemiBold' }}
				>
					{dateLabel}
				</Text>
				<View className='flex-row items-center gap-4'>
					<Pressable
						onPress={() => setPlaylistVisible(true)}
						hitSlop={8}
						accessibilityLabel='오디오 관람 목록 보기'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
					>
						<Ionicons name='musical-notes-outline' size={20} color='#37342F' />
					</Pressable>
					{hasEntry && (
						<Pressable
							onPress={generate}
							hitSlop={8}
							accessibilityLabel='일기 다시 쓰기'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
						>
							<Ionicons name='refresh' size={20} color='#37342F' />
						</Pressable>
					)}
				</View>
			</View>

			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 }}
				showsVerticalScrollIndicator={false}
			>
				{/* 다이어리 속지 */}
				<View
					className='rounded-[3px] bg-[#FFFEF9] px-5 pb-8 pt-10'
					style={{
						shadowColor: '#3E4A50',
						shadowOpacity: 0.25,
						shadowRadius: 10,
						shadowOffset: { width: 0, height: 5 },
						elevation: 6,
					}}
				>
					<GridPaper />

					{/* 마스킹테이프 */}
					<WashiTape
						style={{ position: 'absolute', top: -8, left: 18 }}
						rotate={-5}
					/>
					<WashiTape
						style={{ position: 'absolute', top: -6, right: 24 }}
						rotate={7}
						color='rgba(240, 200, 121, 0.5)'
					/>

					{/* 날짜 스탬프 */}
					<View
						className='self-start rounded-md border-2 border-[#2F5FA8] bg-white px-3 py-1.5'
						style={{ transform: [{ rotate: '-2deg' }] }}
					>
						<Text className='text-[20px] leading-6 text-[#2F5FA8]' style={HAND}>
							{dateLabel}
						</Text>
					</View>

					{/* 손글씨 제목 */}
					<Text className='mt-5 text-[27px] text-[#37342F]' style={HAND}>
						오늘의 전시 관람
					</Text>
					<View className='mt-0.5 h-[3px] w-36 rounded-full bg-[#F2C879]/70' />

					{/* 폴라로이드 + 티켓/해설 스티커 */}
					<View className='mt-6 flex-row items-start'>
						<Polaroid
							source={exhibition.posterImage}
							fallbackColor={exhibition.posterColor}
							caption={exhibition.title}
						/>
						<View className='ml-4 flex-1'>
							{/* 티켓 스티커 */}
							<View
								className='self-start rounded-full border-[1.5px] border-[#2F5FA8] bg-white px-3 py-1'
								style={{ transform: [{ rotate: '2deg' }] }}
							>
								<Text className='text-[13px] tracking-wider text-[#2F5FA8]' style={{ fontFamily: 'Pretendard-Bold' }}>
									{exhibition.venue}
								</Text>
							</View>

							{/* 들은 해설 메모지 */}
							<View
								className='mt-4 rounded-sm bg-[#FBF3CF] px-3 py-3'
								style={{
									transform: [{ rotate: '-1.5deg' }],
									shadowColor: '#4A4238',
									shadowOpacity: 0.15,
									shadowRadius: 4,
									shadowOffset: { width: 0, height: 2 },
									elevation: 3,
								}}
							>
								<Text className='text-[18px] text-[#57534E]' style={HAND}>
									오늘 들은 해설
								</Text>
								{listenedTitles.map((title) => (
									<View key={title} className='mt-1 flex-row items-center'>
										<View className='mr-2 h-1.5 w-1.5 rounded-full bg-[#5B7F5B]' />
										<Text
											className='flex-1 text-[16px] leading-5 text-[#44403C]'
											style={HAND}
											numberOfLines={1}
										>
											{title}
										</Text>
									</View>
								))}
							</View>
						</View>
					</View>

					{/* 일기 본문 */}
					<View className='mt-7 min-h-[180px]'>
						{text ? (
							<Text className='text-[21px] leading-[34px] text-[#3A3633]' style={HAND}>
								{text}
							</Text>
						) : (
							<View className='flex-1 items-center justify-center rounded-lg border border-dashed border-[#C7BFAE] px-6 py-8'>
								{isStreaming ? (
									<>
										<ActivityIndicator color='#2F5FA8' />
										<Text className='mt-3 text-[19px] text-[#78716C]' style={HAND}>
											도슨트가 일기를 쓰고 있어요...
										</Text>
									</>
								) : (
									<>
										<Text className='text-center text-[19px] leading-7 text-[#78716C]' style={HAND}>
											{hasError
												? '일기를 쓰다가 잉크가 번졌어요.\n다시 한번 부탁해볼까요?'
												: '이 날의 관람 기록이 아직 비어 있어요.\nAI 도슨트에게 일기를 부탁해보세요.'}
										</Text>
										<Pressable
											onPress={generate}
											accessibilityLabel='AI 도슨트에게 일기 부탁하기'
											accessibilityRole='button'
											className='mt-5 flex-row items-center rounded-full bg-[#2F5FA8] px-5 py-2.5'
											style={({ pressed }) => ({
												opacity: pressed ? 0.7 : 1,
												transform: [{ rotate: '-1deg' }],
											})}
										>
											<Ionicons name='create-outline' size={18} color='#FFFFFF' />
											<Text
												className='ml-2 text-[15px] text-white'
												style={{ fontFamily: 'Pretendard-SemiBold' }}
											>
												{hasError ? '다시 부탁하기' : 'AI 도슨트에게 일기 부탁하기'}
											</Text>
										</Pressable>
									</>
								)}
							</View>
						)}
					</View>

					{/* 하단 장식 스티커 */}
					<View className='mt-6 flex-row items-center justify-end'>
						<View className='mr-2 h-3 w-3 rounded-full bg-[#D77A61]/70' />
						<View className='mr-3 h-2 w-2 rounded-full bg-[#5B7F5B]/70' />
						<Text className='text-[16px] tracking-widest text-[#A8A29E]' style={HAND}>
							with AI docent
						</Text>
					</View>
				</View>
			</ScrollView>

			<PlaylistModal
				visible={playlistVisible}
				titles={listenedTitles}
				onClose={() => setPlaylistVisible(false)}
			/>
		</SafeAreaView>
	);
}
