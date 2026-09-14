import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	DiaryGuidePlayer,
	type DiaryGuidePlayerHandle,
} from '@/src/components/archive/DiaryGuidePlayer';
import { StarRating } from '@/src/components/archive/StarRating';
import { VisitBlock } from '@/src/components/archive/VisitBlock';
import { TextField } from '@/src/components/common/TextField';
import { dateKeyOf, useVisitStore } from '@/src/store/visitStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useHistoryStore } from '@/src/store/historyStore';
import type { HistoryItem } from '@/src/store/historyStore';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { WEEKDAYS } from '@/src/constants/week';

export default function DiaryDateScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ date?: string; visit?: string }>();
	const insets = useSafeAreaInsets();
	const memoScrollRef = useRef<ScrollView>(null);

	const dateKey = useMemo(() => {
		const raw = typeof params.date === 'string' ? params.date : '';
		return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
	}, [params.date]);

	const dateLabel = useMemo(() => {
		const [y, m, d] = dateKey.split('-').map(Number);
		const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
		return `${y}.${m}.${d} ${weekday}요일`;
	}, [dateKey]);

	const visits = useVisitStore((s) => s.visits);
	const setVisitMemo = useVisitStore((s) => s.setVisitMemo);
	const setVisitRating = useVisitStore((s) => s.setVisitRating);
	const deleteVisit = useVisitStore((s) => s.deleteVisit);
	const playlist = useImmersiveStore((s) => s.playlist);
	const historyItems = useHistoryStore((s) => s.items);

	// visits 키는 "날짜::전시" — 이 날짜에 해당하는 확정 기록을 전부 모은다(여러 개일 수 있음)
	// visit 쿼리 파라미터가 있으면(캘린더에서 여러 개 중 하나를 골라 들어온 경우) 그 방문 하나로 좁힌다
	const dayVisitEntries = useMemo(() => {
		const all = Object.entries(visits).filter(
			([key, v]) => dateKeyOf(key) === dateKey && v.status === 'confirmed',
		);
		if (params.visit) return all.filter(([key]) => key === params.visit);
		return all;
	}, [visits, dateKey, params.visit]);

	const [playingGuide, setPlayingGuide] = useState<HistoryItem | null>(null);
	const playerRef = useRef<DiaryGuidePlayerHandle>(null);
	const [activeMemoKey, setActiveMemoKey] = useState<string | null>(null);
	const memoInputRef = useRef<TextInput>(null);
	const activeMemo = (activeMemoKey && visits[activeMemoKey]?.memo) || '';
	const activeRating = (activeMemoKey && visits[activeMemoKey]?.rating) || 0;

	useEffect(() => {
		if (!activeMemoKey) return;
		const timer = setTimeout(() => memoInputRef.current?.focus(), 80);
		return () => clearTimeout(timer);
	}, [activeMemoKey]);

	const dayChatItems = useMemo(
		() =>
			historyItems.filter(
				(item) =>
					item.savedAt.startsWith(dateKey) && item.chatMessages && item.chatMessages.length > 0,
			),
		[historyItems, dateKey],
	);

	const dayHistoryItems = useMemo(
		() =>
			historyItems.filter(
				(item) => item.savedAt.startsWith(dateKey) && item.text.trim().length > 0,
			),
		[historyItems, dateKey],
	);

	const handleDeletePress = (visitKey: string) => {
		Alert.alert('티켓 삭제', '이 티켓을 삭제할까요?', [
			{ text: '닫기', style: 'cancel' },
			{
				text: '삭제',
				style: 'destructive',
				onPress: async () => {
					await deleteVisit(visitKey);
					if (dayVisitEntries.length <= 1) router.back();
				},
			},
		]);
	};

	return (
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Back color="white" onPress={() => router.back()} />
				<ScreenHeader.Center>
					<Text className="text-[16px] text-white font-pretendard-semibold">{dateLabel}</Text>
				</ScreenHeader.Center>
			</ScreenHeader>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerClassName="pb-10"
			>
				{dayVisitEntries.map(([visitKey, visit]) => (
					<VisitBlock
						key={visitKey}
						visit={visit}
						dateKey={dateKey}
						dateLabel={dateLabel}
						playlistTitles={playlist.map((p) => p.title)}
						onEditMemo={() => setActiveMemoKey(visitKey)}
						onDelete={() => handleDeletePress(visitKey)}
						dayChatItems={dayChatItems}
						dayHistoryItems={dayHistoryItems}
						onPlayGuide={(item) => {
							setPlayingGuide(item);
							playerRef.current?.expand();
						}}
					/>
				))}
			</ScrollView>

			<DiaryGuidePlayer ref={playerRef} item={playingGuide} onClose={() => setPlayingGuide(null)} />

			{activeMemoKey !== null && (
				<View className="absolute inset-0 z-50">
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						className="flex-1 justify-end"
					>
						<Pressable
							className="flex-1 bg-black/50"
							onPress={() => setActiveMemoKey(null)}
							accessibilityRole="button"
							accessibilityLabel="감상 편집 닫기"
						/>
						<View
							className="bg-gray900 rounded-t-3xl px-6 pt-5"
							style={{ paddingBottom: insets.bottom + 40 }}
						>
							<View className="flex-row items-center justify-between mb-4">
								<Text className="text-white font-pretendard-semibold text-[17px]">
									나의 감상 편집
								</Text>
								<Pressable
									onPress={() => setActiveMemoKey(null)}
									hitSlop={8}
									accessibilityLabel="닫기"
									accessibilityRole="button"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Ionicons name="checkmark" size={22} color="white" />
								</Pressable>
							</View>
							<View className="mb-4">
								<StarRating
									value={activeRating}
									onChange={(n) => activeMemoKey && setVisitRating(activeMemoKey, n)}
									size={26}
									tone="dark"
								/>
							</View>
							<ScrollView
								ref={memoScrollRef}
								keyboardShouldPersistTaps="handled"
								showsVerticalScrollIndicator={false}
								className="max-h-[200px]"
								onContentSizeChange={() => memoScrollRef.current?.scrollToEnd({ animated: false })}
							>
								<TextField
									ref={memoInputRef}
									variant="plain"
									tone="dark"
									value={activeMemo}
									onChangeText={(text) => activeMemoKey && setVisitMemo(activeMemoKey, text)}
									placeholder="오늘 기억하고 싶은 것을 적어보세요"
									placeholderTextColor="rgba(255,255,255,0.3)"
									multiline
									scrollEnabled={false}
									maxLength={400}
									accessibilityLabel="관람 메모 입력"
									className="text-white text-[15px] leading-[24px] min-h-[120px]"
								/>
							</ScrollView>
						</View>
					</KeyboardAvoidingView>
				</View>
			)}
		</Screen>
	);
}
