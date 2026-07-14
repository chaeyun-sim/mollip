import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaylistModal } from '@/src/components/archive/PlaylistModal';
import { useDiaryEntry } from '@/src/hooks/useDiaryEntry';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { DIARY_PROMPT } from '@/src/constants/prompts';
import { EXHIBITIONS } from '@/src/data/exhibitions';

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
		<SafeAreaView className='flex-1 bg-[#F8F6F2]' edges={['top']}>
			<StatusBar style='dark' />
			{/* 헤더 */}
			<View className='flex-row items-center justify-between px-6 py-3'>
				<Pressable
					onPress={() => router.back()}
					hitSlop={8}
					accessibilityLabel='뒤로 가기'
					accessibilityRole='button'
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
				>
					<Ionicons name='arrow-back' size={22} color='#111827' />
				</Pressable>
				<Text className='text-[16px] font-pretendard-semibold text-gray-900'>
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
						<Ionicons name='musical-notes-outline' size={20} color='#111827' />
					</Pressable>
					{hasEntry && (
						<Pressable
							onPress={generate}
							hitSlop={8}
							accessibilityLabel='일기 다시 쓰기'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
						>
							<Ionicons name='refresh' size={20} color='#111827' />
						</Pressable>
					)}
				</View>
			</View>

			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8 }}
				showsVerticalScrollIndicator={false}
			>
				{/* 타이틀 */}
				<Text className='text-gray-900 text-[26px] leading-[34px] font-hahmlet-bold'>
					오늘의 전시 관람
				</Text>

				{/* 관람한 전시 카드 */}
				<View className='mt-6 flex-row items-center gap-4 rounded-2xl bg-[#F2EFE9] p-4'>
					{exhibition.posterImage ? (
						<Image
							source={exhibition.posterImage}
							resizeMode='cover'
							className='rounded-xl'
							style={{ width: 64, height: 64 }}
						/>
					) : (
						<View
							className='h-16 w-16 flex-shrink-0 rounded-xl'
							style={{ backgroundColor: exhibition.posterColor }}
						/>
					)}
					<View className='flex-1'>
						<Text
							className='font-pretendard-semibold text-[15px] leading-[21px] text-gray-900'
							numberOfLines={2}
						>
							{exhibition.title}
						</Text>
						<Text className='mt-1 font-pretendard-regular text-[12px] text-gray-400'>
							{exhibition.venue}
						</Text>
					</View>
				</View>

				{/* 오늘 들은 해설 */}
				<View className='mt-8'>
					<View className='mb-3 flex-row items-center gap-2'>
						<Ionicons name='headset-outline' size={15} color='#9CA3AF' />
						<Text className='font-pretendard-semibold text-[13px] uppercase tracking-widest text-gray-400'>
							오늘 들은 해설
						</Text>
					</View>
					<View className='rounded-2xl bg-white px-5 py-2'>
						{listenedTitles.map((title, index) => (
							<View
								key={title}
								className='flex-row items-center py-3'
								style={
									index < listenedTitles.length - 1
										? { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }
										: undefined
								}
							>
								<Text className='w-7 text-[13px] font-pretendard-medium text-gray-400'>
									{index + 1}
								</Text>
								<Text
									className='flex-1 text-[14px] font-pretendard-regular text-gray-800'
									numberOfLines={1}
								>
									{title}
								</Text>
							</View>
						))}
					</View>
				</View>

				{/* 일기 본문 */}
				<View className='mt-8'>
					<View className='mb-3 flex-row items-center gap-2'>
						<Ionicons name='create-outline' size={15} color='#9CA3AF' />
						<Text className='font-pretendard-semibold text-[13px] uppercase tracking-widest text-gray-400'>
							AI 도슨트의 일기
						</Text>
					</View>
					{text ? (
						<View className='rounded-2xl bg-white p-5'>
							<Text className='font-pretendard-light text-[15px] leading-[27px] text-gray-700'>
								{text}
							</Text>
						</View>
					) : (
						<View className='min-h-[200px] items-center justify-center rounded-2xl bg-white px-6 py-10'>
							{isStreaming ? (
								<>
									<ActivityIndicator color='#111827' />
									<Text className='mt-3 text-[14px] font-pretendard-regular text-gray-400'>
										도슨트가 일기를 쓰고 있어요...
									</Text>
								</>
							) : (
								<>
									<Text className='text-center text-[14px] leading-6 font-pretendard-regular text-gray-400'>
										{hasError
											? '일기를 쓰다가 잉크가 번졌어요.\n다시 한번 부탁해볼까요?'
											: '이 날의 관람 기록이 아직 비어 있어요.\nAI 도슨트에게 일기를 부탁해보세요.'}
									</Text>
									<Pressable
										onPress={generate}
										accessibilityLabel='AI 도슨트에게 일기 부탁하기'
										accessibilityRole='button'
										className='mt-5 flex-row items-center rounded-full bg-[#1C1917] px-5 py-2.5'
										style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
									>
										<Ionicons name='create-outline' size={16} color='white' />
										<Text className='ml-2 text-[14px] font-pretendard-semibold text-white'>
											{hasError ? '다시 부탁하기' : 'AI 도슨트에게 일기 부탁하기'}
										</Text>
									</Pressable>
								</>
							)}
						</View>
					)}
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
