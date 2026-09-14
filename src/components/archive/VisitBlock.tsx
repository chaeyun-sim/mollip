import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, Text, View } from 'react-native';

import { StarRating } from '@/src/components/archive/StarRating';
import { VisitTicket } from '@/src/components/archive/VisitTicket';
import { useExhibitionDetail } from '@/src/hooks/useExhibitionDetail';
import { cn } from '@/src/lib/cn';
import type { HistoryItem } from '@/src/store/historyStore';
import { isTicketVisit } from '@/src/store/visitStore';
import type { DayVisit, ListenedItem } from '@/src/store/visitStore';

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
export function VisitBlock({
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
	const dotsRef = useRef<View>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState({ top: 0, right: 0 });

	const ticketVerified = isTicketVisit(visit);

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
		if (ticketVerified) return [];
		if (visit.listened.length > 0) return visit.listened.map((l) => l.title);
		if (playlistTitles.length > 0) return playlistTitles;
		return exhibition.artworks.slice(0, 3).map((a) => a.title);
	}, [ticketVerified, visit, playlistTitles, exhibition]);

	const listenedItems = useMemo((): ListenedItem[] => {
		if (ticketVerified) return [];
		if (visit.listened.length > 0) return visit.listened;
		return listenedTitles.map((title) => ({ title }));
	}, [ticketVerified, visit, listenedTitles]);

	const visitChatItems = useMemo(
		() =>
			dayChatItems.filter(
				(item) => listenedTitles.includes(item.title) || item.title === exhibition.title,
			),
		[dayChatItems, listenedTitles, exhibition.title],
	);

	const playableByTitle = useMemo(() => {
		const map = new Map<string, HistoryItem>();
		for (const item of dayHistoryItems) {
			if (!listenedTitles.includes(item.title) && item.title !== exhibition.title) continue;
			if (!map.has(item.title)) map.set(item.title, item);
		}
		return map;
	}, [dayHistoryItems, listenedTitles, exhibition.title]);

	const playableTitles = useMemo(() => [...playableByTitle.keys()], [playableByTitle]);

	const handleOpenMenu = useCallback(() => {
		dotsRef.current?.measureInWindow((x, y, width, height) => {
			setMenuAnchor({
				top: y + height + 6,
				right: Dimensions.get('window').width - (x + width),
			});
			setMenuOpen(true);
		});
	}, []);
	const handleClose = useCallback(() => setMenuOpen(false), []);
	const handlePlayListened = useCallback(
		(item: ListenedItem) => {
			const guide = playableByTitle.get(item.title);
			if (guide) onPlayGuide({ ...guide, imageUrl: guide.imageUrl ?? item.imageUrl });
		},
		[playableByTitle, onPlayGuide],
	);
	const handleEditMemo = useCallback(() => {
		setMenuOpen(false);
		onEditMemo();
	}, [onEditMemo]);

	const handleDelete = useCallback(() => {
		setMenuOpen(false);
		onDelete();
	}, [onDelete]);

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
					ticketPhotoUri={visit.thumbnail}
					venuePhotos={visit.venuePhotos}
					onPlayListened={handlePlayListened}
				/>
				{/* 티켓 이미지 위 점 세 개 — 눌러야 수정/삭제 메뉴가 바로 아래에 나타난다 */}
				<Pressable
					ref={dotsRef}
					onPress={handleOpenMenu}
					hitSlop={8}
					accessibilityLabel="티켓 옵션 더보기"
					accessibilityRole="button"
					className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full items-center justify-center bg-black/35"
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
				</Pressable>
			</View>

			{(visit.rating || visit.memo) && (
				<View className="mt-5 px-4">
					{visit.rating && (
						<StarRating value={visit.rating} onChange={() => {}} disabled size={20} tone="dark" />
					)}
					{visit.memo && (
						<Text className="mt-2.5 text-[14px] font-pretendard-regular text-white leading-[20px]">
							{visit.memo}
						</Text>
					)}
				</View>
			)}

			{visitChatItems.length > 0 && (
				<>
					<View className="h-px mx-4 mt-8 mb-8 bg-gray800" />
					{visitChatItems.map((item, index) => (
						<View key={item.id} className={cn('px-4', index > 0 && 'mt-8')}>
							<Text
								className="text-[15px] font-pretendard-semibold text-white/75 mb-3"
								numberOfLines={1}
								accessibilityRole="header"
							>
								{`『${item.title}』${item.artist ? ` - ${item.artist}` : ''}`}
							</Text>
							<View className="gap-y-2">
								{item.chatMessages!.map((msg) => (
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
					))}
				</>
			)}

			{/* 수정/삭제 메뉴 — 점 세 개 바로 아래에 뜬다 */}
			<Modal visible={menuOpen} transparent animationType="fade" onRequestClose={handleClose}>
				<Pressable className="flex-1" onPress={handleClose} accessibilityLabel="메뉴 닫기">
					<View
						className="absolute rounded-2xl overflow-hidden bg-gray900 border border-white/10"
						style={{ top: menuAnchor.top, right: menuAnchor.right }}
					>
						<Pressable
							onPress={handleEditMemo}
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
							onPress={handleDelete}
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
