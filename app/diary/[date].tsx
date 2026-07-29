import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlaylistModal } from '@/src/components/archive/PlaylistModal';
import { VisitTicket } from '@/src/components/archive/VisitTicket';
import { useDiaryEntry } from '@/src/hooks/useDiaryEntry';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useVisitStore } from '@/src/store/visitStore';
import { DIARY_PROMPT } from '@/src/constants/prompts';
import { EXHIBITIONS, getExhibition } from '@/src/data/exhibitions';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';

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

	// 관람 기록: 그날의 방문 기록(visitStore) 우선, 없으면 데모 데이터로 대체
	const visit = useVisitStore((s) => s.visits[dateKey]);
	const playlist = useImmersiveStore((s) => s.playlist);
	const [playlistVisible, setPlaylistVisible] = useState(false);

	const exhibition = useMemo(
		() =>
			(visit?.exhibitionId ? getExhibition(visit.exhibitionId) : undefined) ??
			EXHIBITIONS[0],
		[visit],
	);

	const listenedTitles = useMemo(() => {
		if (visit && visit.listened.length > 0) return visit.listened.map((l) => l.title);
		if (playlist.length > 0) return playlist.map((p) => p.title);
		return exhibition.artworks.slice(0, 3).map((a) => a.title);
	}, [visit, playlist, exhibition]);

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
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Back color="white" onPress={() => router.back()} />
				<ScreenHeader.Center>
					<Text className='text-[16px] font-pretendard-semibold text-white'>
					{dateLabel}
				</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right>
					<View className='flex-row items-center gap-4'>
					<Pressable
						onPress={() => setPlaylistVisible(true)}
						hitSlop={8}
						accessibilityLabel='오디오 관람 목록 보기'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
					>
						<Ionicons name='musical-notes-outline' size={20} color='white' />
					</Pressable>
					{hasEntry && (
						<Pressable
							onPress={generate}
							hitSlop={8}
							accessibilityLabel='일기 다시 쓰기'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
						>
							<Ionicons name='refresh' size={20} color='white' />
						</Pressable>
					)}
				</View>
				</ScreenHeader.Right>
			</ScreenHeader>


			{/* <ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8 }}
				showsVerticalScrollIndicator={false}
			> */}

				{/* 관람 티켓: 앞면 관람 정보 + 뒷면 AI 일기 */}
				<View className='justify-center pt-10 px-4'>
					<VisitTicket
						exhibition={exhibition}
						listenedTitles={listenedTitles}
						dateKey={dateKey}
						dateLabel={dateLabel}
						diaryText={text}
						isStreaming={isStreaming}
						hasError={hasError}
						onGenerate={generate}
					/>
				</View>

				{/* 일기 본문 */}
				{/* <View className='mt-8'>
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
				</View> */}
			{/* </ScrollView> */}

			<PlaylistModal
				visible={playlistVisible}
				titles={listenedTitles}
				onClose={() => setPlaylistVisible(false)}
			/>
		</Screen>
	);
}
