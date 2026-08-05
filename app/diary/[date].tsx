import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PlaylistModal } from '@/src/components/archive/PlaylistModal';
import { VisitTicket } from '@/src/components/archive/VisitTicket';
import { useExhibitionDetail } from '@/src/hooks/useExhibitionDetail';
import type { ListenedItem } from '@/src/store/visitStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useVisitStore } from '@/src/store/visitStore';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default function DiaryScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ date?: string }>();

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

	const visit = useVisitStore((s) => s.visits[dateKey]);
	const setVisitMemo = useVisitStore((s) => s.setVisitMemo);
	const playlist = useImmersiveStore((s) => s.playlist);
	const [playlistVisible, setPlaylistVisible] = useState(false);

	const visitExhibitionId = visit?.exhibitionId;
	const { exhibition: visitExhibition } = useExhibitionDetail(
		visitExhibitionId ?? undefined,
	);

	const exhibition = useMemo(
		() =>
			visitExhibition ?? {
				id: visit?.exhibitionId ?? 'placeholder',
				title: visit?.exhibitionTitle ?? '오늘의 전시',
				venue: visit?.venue ?? '',
				startDate: '',
				endDate: '',
				description: '',
				posterColor: '#E8E4DC',
				genre: '전시',
				openHours: '',
				admission: '',
				artworks: [],
				relatedExhibitionIds: [],
			},
		[visitExhibition, visit],
	);

	const listenedTitles = useMemo(() => {
		if (visit && visit.listened.length > 0)
			return visit.listened.map((l) => l.title);
		if (playlist.length > 0) return playlist.map((p) => p.title);
		return exhibition.artworks.slice(0, 3).map((a) => a.title);
	}, [visit, playlist, exhibition]);

	const listenedItems = useMemo((): ListenedItem[] => {
		if (visit?.listened && visit.listened.length > 0) return visit.listened;
		return listenedTitles.map((title) => ({ title }));
	}, [visit?.listened, listenedTitles]);

	const memo = visit?.memo ?? '';

	const handleMemoChange = useCallback(
		(text: string) => {
			setVisitMemo(dateKey, text);
		},
		[dateKey, setVisitMemo],
	);

	return (
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Back color='white' onPress={() => router.back()} />
				<ScreenHeader.Center>
					<Text className='text-[16px] text-white font-pretendard-semibold'>
						{dateLabel}
					</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right>
					<Pressable
						onPress={() => setPlaylistVisible(true)}
						hitSlop={8}
						accessibilityLabel='오디오 관람 목록 보기'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
					>
						<Ionicons name='musical-notes-outline' size={20} color='white' />
					</Pressable>
				</ScreenHeader.Right>
			</ScreenHeader>

			<View className='justify-center pt-10 px-4'>
				<VisitTicket
					exhibition={exhibition}
					listenedTitles={listenedTitles}
					listenedItems={listenedItems}
					dateKey={dateKey}
					dateLabel={dateLabel}
					memo={memo}
					onMemoChange={handleMemoChange}
				/>
			</View>

			<PlaylistModal
				visible={playlistVisible}
				titles={listenedTitles}
				onClose={() => setPlaylistVisible(false)}
			/>
		</Screen>
	);
}
