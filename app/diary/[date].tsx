import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
	Alert,
	Dimensions,
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

import {
	DiaryGuidePlayer,
	type DiaryGuidePlayerHandle,
} from '@/src/components/archive/DiaryGuidePlayer';
import { VisitTicket } from '@/src/components/archive/VisitTicket';
import { StarRating } from '@/src/components/archive/StarRating';
import { TextField } from '@/src/components/common/TextField';
import { useExhibitionDetail } from '@/src/hooks/useExhibitionDetail';
import type { DayVisit, ListenedItem } from '@/src/store/visitStore';
import { dateKeyOf, useVisitStore } from '@/src/store/visitStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useHistoryStore } from '@/src/store/historyStore';
import type { HistoryItem, StoredChatMessage } from '@/src/store/historyStore';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { WEEKDAYS } from '@/src/constants/week';
import { cn } from '@/src/lib/cn';

interface ChatHistorySectionProps {
	title: string;
	artist: string;
	messages: StoredChatMessage[];
	isFirst?: boolean;
}

function ChatHistorySection({ title, artist, messages, isFirst }: ChatHistorySectionProps) {
	return (
		<View className={cn('px-4', !isFirst && 'mt-8')}>
			<Text
				className="text-[15px] font-pretendard-semibold text-white/75 mb-3"
				numberOfLines={1}
				accessibilityRole="header"
			>
				{`『${title}』${artist ? ` - ${artist}` : ''}`}
			</Text>
			<View className="gap-y-2">
				{messages.map((msg) => (
					<View
						key={msg.id}
						className={msg.role === 'user' ? 'items-end' : 'items-start'}
						accessibilityRole="text"
						accessibilityLabel={
							msg.role === 'user' ? `내 질문: ${msg.text}` : `AI 답변: ${msg.text}`
						}
					>
						<View
							className={
								msg.role === 'user'
									? 'bg-primary rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]'
									: 'bg-divider-dark rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]'
							}
						>
							<Text className="font-pretendard-regular text-[14px] leading-[20px] text-white">
								{msg.text}
							</Text>
						</View>
					</View>
				))}
			</View>
		</View>
	);
}

interface MyReviewSectionProps {
	rating?: number;
	memo?: string;
}

// 확정 큐에서 남긴 별점/한줄평 — 티켓 안에 욱여넣지 않고 채팅 기록처럼 티켓 아래 별도 섹션으로 둔다
function MyReviewSection({ rating, memo }: MyReviewSectionProps) {
	if (!rating && !memo) return null;

	return (
		<View className="mt-5 px-4">
			{rating && (
				<StarRating value={rating} onChange={() => {}} disabled size={20} tone="dark" />
			)}
			{memo && (
				<Text className="mt-2.5 text-[14px] font-pretendard-regular text-white leading-[20px]">
					{memo}
				</Text>
			)}
		</View>
	);
}

interface VisitBlockProps {
	visit: DayVisit;
	dateKey: string;
	dateLabel: string;
	playlistTitles: string[];
	/** 그날 저장된 채팅 기록 전부 — 이 방문에서 들은 작품과 제목이 겹치는 것만 골라 이 티켓 아래에 붙인다 */
	dayChatItems: HistoryItem[];
	/** 그날 해설 텍스트가 있는 기록 — 티켓 프로그램 탭 재생에 쓴다 */
	dayHistoryItems: HistoryItem[];
	onPlayGuide: (item: HistoryItem) => void;
	onEditMemo: () => void;
	onDelete: () => void;
}

// 하루에 확정된 관람이 여러 개면 이 블록이 그만큼 반복된다 — 티켓 하나 + 그 관람의 서명/메모/채팅/삭제
function VisitBlock({
	visit,
	dateKey,
	dateLabel,
	playlistTitles,
	dayChatItems,
	dayHistoryItems,
	onPlayGuide,
	onEditMemo,
	onDelete,
}: VisitBlockProps) {
	const { exhibition: visitExhibition } = useExhibitionDetail(visit.exhibitionId ?? undefined);

	const exhibition = useMemo(
		() =>
			visitExhibition ?? {
				id: visit.exhibitionId ?? 'placeholder',
				title: visit.exhibitionTitle ?? '오늘의 전시',
				venue: visit.venue ?? '',
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
		if (visit.listened.length > 0) return visit.listened.map((l) => l.title);
		if (playlistTitles.length > 0) return playlistTitles;
		return exhibition.artworks.slice(0, 3).map((a) => a.title);
	}, [visit, playlistTitles, exhibition]);

	const listenedItems = useMemo((): ListenedItem[] => {
		if (visit.listened.length > 0) return visit.listened;
		return listenedTitles.map((title) => ({ title }));
	}, [visit, listenedTitles]);

	// 하루에 전시를 여러 개 봤을 때 채팅이 뒤섞이지 않도록 — 작품 채팅(들은 작품 제목과 겹침)이든
	// 전시 채팅(플레이리스트 FAB에서 온, 전시 제목과 겹침)이든 이 방문 것만 골라 이 티켓에 붙인다
	const visitChatItems = useMemo(
		() =>
			dayChatItems.filter(
				(item) => listenedTitles.includes(item.title) || item.title === exhibition.title,
			),
		[dayChatItems, listenedTitles, exhibition.title],
	);

	const dotsRef = useRef<View>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState({ top: 0, right: 0 });
	const playableByTitle = useMemo(() => {
		const map = new Map<string, HistoryItem>();
		for (const item of dayHistoryItems) {
			if (!listenedTitles.includes(item.title) && item.title !== exhibition.title) continue;
			if (!map.has(item.title)) map.set(item.title, item);
		}
		return map;
	}, [dayHistoryItems, listenedTitles, exhibition.title]);

	const playableTitles = useMemo(() => [...playableByTitle.keys()], [playableByTitle]);

	function openMenu() {
		dotsRef.current?.measureInWindow((x, y, width, height) => {
			setMenuAnchor({
				top: y + height + 6,
				right: Dimensions.get('window').width - (x + width),
			});
			setMenuOpen(true);
		});
	}

	return (
		<View className="pt-4">
			<View className="relative">
				<VisitTicket
					exhibition={exhibition}
					listenedTitles={listenedTitles}
					listenedItems={listenedItems}
					dateKey={dateKey}
					dateLabel={dateLabel}
					signatureSvg={visit.signatureSvg}
					visitedAt={visit.visitedAt}
					playableTitles={playableTitles}
					onPlayListened={(item) => {
						const guide = playableByTitle.get(item.title);
						if (guide) onPlayGuide({ ...guide, imageUrl: guide.imageUrl ?? item.imageUrl });
					}}
				/>
				{/* 티켓 이미지 위 점 세 개 — 눌러야 수정/삭제 메뉴가 바로 아래에 나타난다 */}
				<Pressable
					ref={dotsRef}
					onPress={openMenu}
					hitSlop={8}
					accessibilityLabel="티켓 옵션 더보기"
					accessibilityRole="button"
					className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full items-center justify-center bg-black/35"
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
				</Pressable>
			</View>

			<MyReviewSection rating={visit.rating} memo={visit.memo} />

			{visitChatItems.length > 0 && (
				<>
					<View className="h-px mx-4 mt-8 mb-8 bg-gray800" />
					{visitChatItems.map((item, index) => (
						<ChatHistorySection
							key={item.id}
							title={item.title}
							artist={item.artist ?? ''}
							messages={item.chatMessages!}
							isFirst={index === 0}
						/>
					))}
				</>
			)}

			{/* 수정/삭제 메뉴 — 점 세 개 바로 아래에 뜬다 */}
			<Modal
				visible={menuOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setMenuOpen(false)}
			>
				<Pressable
					style={{ flex: 1 }}
					onPress={() => setMenuOpen(false)}
					accessibilityLabel="메뉴 닫기"
				>
					<View
						className="absolute rounded-2xl overflow-hidden bg-gray900 border border-white/10"
						style={{ top: menuAnchor.top, right: menuAnchor.right }}
					>
						<Pressable
							onPress={() => {
								setMenuOpen(false);
								onEditMemo();
							}}
							className="flex-row items-center gap-2 px-4 py-3"
							accessibilityRole="button"
							accessibilityLabel="나의 감상 편집"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons name="pencil-outline" size={16} color="#fff" />
							<Text className="text-white text-[14px] font-pretendard-medium">수정</Text>
						</Pressable>
						<View className="h-hairline bg-white/10" />
						<Pressable
							onPress={() => {
								setMenuOpen(false);
								onDelete();
							}}
							className="flex-row items-center gap-2 px-4 py-3"
							accessibilityRole="button"
							accessibilityLabel="티켓 삭제"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons name="trash-outline" size={16} color="#F43F5E" />
							<Text className="text-[#F43F5E] text-[14px] font-pretendard-medium">삭제</Text>
						</Pressable>
					</View>
				</Pressable>
			</Modal>
		</View>
	);
}

export default function DiaryDateScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ date?: string; visit?: string }>();

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
			historyItems.filter((item) => item.savedAt.startsWith(dateKey) && item.text.trim().length > 0),
		[historyItems, dateKey],
	);

	function handleDeletePress(visitKey: string) {
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
	}

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

			<DiaryGuidePlayer
				ref={playerRef}
				item={playingGuide}
				onClose={() => setPlayingGuide(null)}
			/>

			{/* 메모 편집 모달 */}
			<Modal
				visible={activeMemoKey !== null}
				transparent
				animationType="slide"
				onRequestClose={() => setActiveMemoKey(null)}
				onShow={() => setTimeout(() => memoInputRef.current?.focus(), 100)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					className="flex-1"
				>
					<TouchableWithoutFeedback onPress={() => setActiveMemoKey(null)}>
						<View className="flex-1" />
					</TouchableWithoutFeedback>
					<View className="bg-gray900 rounded-t-3xl px-6 pt-5 pb-10">
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
						<TextField
							ref={memoInputRef}
							variant="plain"
							tone="dark"
							value={activeMemo}
							onChangeText={(text) => activeMemoKey && setVisitMemo(activeMemoKey, text)}
							placeholder="오늘 기억하고 싶은 것을 적어보세요"
							placeholderTextColor="rgba(255,255,255,0.3)"
							multiline
							maxLength={400}
							accessibilityLabel="관람 메모 입력"
							className="text-white text-[15px] leading-[24px] min-h-[120px]"
						/>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</Screen>
	);
}
