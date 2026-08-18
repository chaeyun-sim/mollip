import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

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
	const [memoVisible, setMemoVisible] = useState(false);
	const memoInputRef = useRef<TextInput>(null);

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
						onPress={() => setMemoVisible(true)}
						hitSlop={8}
						accessibilityLabel='관람 메모 편집'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
					>
						<Ionicons name='pencil-outline' size={20} color='white' />
					</Pressable>
				</ScreenHeader.Right>
			</ScreenHeader>

			<View className='pt-4'>
				<VisitTicket
					exhibition={exhibition}
					listenedTitles={listenedTitles}
					listenedItems={listenedItems}
					dateKey={dateKey}
					dateLabel={dateLabel}
				/>
			</View>

			{/* 메모 편집 모달 */}
			<Modal
				visible={memoVisible}
				transparent
				animationType='slide'
				onRequestClose={() => setMemoVisible(false)}
				onShow={() => setTimeout(() => memoInputRef.current?.focus(), 100)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					className='flex-1'
				>
					<TouchableWithoutFeedback onPress={() => setMemoVisible(false)}>
						<View className='flex-1' />
					</TouchableWithoutFeedback>
					<View className='bg-[#1C1917] rounded-t-3xl px-6 pt-5 pb-10'>
						<View className='flex-row items-center justify-between mb-4'>
							<Text className='text-white font-pretendard-semibold text-[17px]'>
								나의 관람 메모
							</Text>
							<Pressable
								onPress={() => setMemoVisible(false)}
								hitSlop={8}
								accessibilityLabel='닫기'
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							>
								<Ionicons name='checkmark' size={22} color='white' />
							</Pressable>
						</View>
						<TextInput
							ref={memoInputRef}
							value={memo}
							onChangeText={handleMemoChange}
							placeholder='오늘 기억하고 싶은 것을 적어보세요'
							placeholderTextColor='rgba(255,255,255,0.3)'
							multiline
							maxLength={400}
							accessibilityLabel='관람 메모 입력'
							className='text-white font-pretendard-regular text-[15px] leading-[24px] min-h-[120px]'
							textAlignVertical='top'
						/>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</Screen>
	);
}
