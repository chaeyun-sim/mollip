import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, Text, View } from 'react-native';
import { ArtworkChatThread } from '@/src/components/archive/ArtworkChatThread';
import { ListenedArtworkRow } from '@/src/components/archive/ListenedArtworkRow';
import { PhotoGallery } from '@/src/components/archive/PhotoGallery';
import { StarRating } from '@/src/components/archive/StarRating';
import { VisitSectionHeader } from '@/src/components/archive/VisitSectionHeader';
import { colors } from '@/src/constants/colors';
import { useExhibitionDetail } from '@/src/hooks/queries/useExhibitionDetail';
import { cn } from '@/src/lib/cn';
import type { HistoryItem, StoredChatMessage } from '@/src/store/historyStore';
import { isTicketVisit } from '@/src/store/visitStore';
import type { DayVisit, ListenedItem } from '@/src/store/visitStore';
import { cleanText } from '@/src/utils/museumWall';
import { buildCreditLine } from '@/src/utils/visitCredit';
import { buildVisitPhotos } from '@/src/utils/visitGallery';

interface VisitBlockProps {
	visit: DayVisit;
	dateKey: string;
	dateLabel: string;
	playlistTitles: string[];
	/** 그날 저장된 채팅 기록 전부 — 이 방문에서 들은 작품과 제목이 겹치는 것만 골라 사진 아래에 붙인다 */
	dayChatItems: HistoryItem[];
	/** 그날 해설 텍스트가 있는 기록 — 들은 작품 탭 재생에 쓴다 */
	dayHistoryItems: HistoryItem[];
	onPlayGuide: (item: HistoryItem) => void;
	onEditMemo: () => void;
	onDelete: () => void;
	/** 사진이 상태바 뒤까지 이어질 때 그 안전 영역 높이 — 첫 블록만 값을 주고 나머지는 0 */
	heroTopInset?: number;
	/** 히어로에 실제 사진이 있는지 알린다 — 화면이 상태바 글자색과 버튼 면을 고르는 데 쓴다 */
	onHeroPhotoChange?: (hasPhoto: boolean) => void;
}

// 하루에 확정된 관람이 여러 개면 이 블록이 그만큼 반복된다 — 사진 갤러리 + 그 관람의 제목/메타/감상/채팅/메뉴
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
	heroTopInset = 0,
	onHeroPhotoChange,
}: VisitBlockProps) {
	const { t, i18n } = useTranslation();

	const dotsRef = useRef<View>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState({ top: 0, right: 0 });

	const hasOwnPhotos = isTicketVisit(visit);

	const { data: visitExhibition } = useExhibitionDetail(visit.exhibitionId ?? undefined);

	const isEn = i18n.language === 'en';
	// title은 그날 채팅·해설 기록과 제목을 맞추는 키로도 쓰니 저장된 원래 제목을 유지한다
	const title =
		cleanText(visit.exhibitionTitle) ?? visitExhibition?.title ?? t('diary.untitled_exhibition');
	// 화면에 보이는 제목·장소만 영어일 때 전시 영문 값으로 바꾼다
	const displayTitle = (isEn ? cleanText(visitExhibition?.titleEn) : undefined) ?? title;
	const venue =
		(isEn ? cleanText(visitExhibition?.venueEn) : undefined) ??
		cleanText(visit.venue) ??
		cleanText(visitExhibition?.venue);
	const memo = cleanText(visit.memo);
	// 작가는 전시 상세(Exhibition.artist)에 있을 때만 쓴다 — DayVisit에는 없고 작품 작가로 대신 채우지 않는다
	const creditLine = buildCreditLine(visitExhibition?.artist, venue);
	const rating = visit.rating ?? 0;
	const hasRating = rating > 0;
	const ratingText = rating.toFixed(1);
	const hasReview = hasRating || Boolean(memo);

	const photos = useMemo(
		() => buildVisitPhotos(visit, visitExhibition?.heroImageUri),
		[visit, visitExhibition?.heroImageUri],
	);

	const hasHeroPhoto = photos.length > 0;
	useEffect(() => {
		onHeroPhotoChange?.(hasHeroPhoto);
	}, [hasHeroPhoto, onHeroPhotoChange]);

	const listenedItems = useMemo((): ListenedItem[] => {
		if (visit.listened.length > 0) return visit.listened;
		// 사진을 직접 올린 기록은 추정 목록을 만들지 않는다
		if (hasOwnPhotos) return [];
		if (playlistTitles.length > 0) return playlistTitles.map((t) => ({ title: t }));
		return (visitExhibition?.artworks ?? []).slice(0, 3).map((a) => ({ title: a.title }));
	}, [visit, hasOwnPhotos, playlistTitles, visitExhibition]);

	const listenedTitles = useMemo(() => listenedItems.map((l) => l.title), [listenedItems]);

	const visitChatItems = useMemo(
		() =>
			dayChatItems.filter((item) => listenedTitles.includes(item.title) || item.title === title),
		[dayChatItems, listenedTitles, title],
	);

	// 들은 작품 행에 붙일 대화 — 같은 제목의 기록이 여럿이면 메시지를 이어 붙인다
	const chatByTitle = useMemo(() => {
		const map = new Map<string, StoredChatMessage[]>();
		for (const item of visitChatItems) {
			if (!listenedTitles.includes(item.title)) continue;
			map.set(item.title, [...(map.get(item.title) ?? []), ...(item.chatMessages ?? [])]);
		}
		return map;
	}, [visitChatItems, listenedTitles]);

	// 들은 작품 목록에 없는 대화(전시 자체에 대한 질문 등)는 별도 섹션으로 남긴다
	const otherChatItems = useMemo(
		() => visitChatItems.filter((item) => !listenedTitles.includes(item.title)),
		[visitChatItems, listenedTitles],
	);

	const playableByTitle = useMemo(() => {
		const map = new Map<string, HistoryItem>();
		for (const item of dayHistoryItems) {
			if (!listenedTitles.includes(item.title) && item.title !== title) continue;
			if (!map.has(item.title)) map.set(item.title, item);
		}
		return map;
	}, [dayHistoryItems, listenedTitles, title]);

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
	const handlePlayListened = (item: ListenedItem) => {
		const guide = playableByTitle.get(item.title);
		if (guide) onPlayGuide({ ...guide, imageUrl: guide.imageUrl ?? item.imageUrl });
	};
	const handleEditMemo = useCallback(() => {
		setMenuOpen(false);
		onEditMemo();
	}, [onEditMemo]);
	const handleDelete = useCallback(() => {
		setMenuOpen(false);
		onDelete();
	}, [onDelete]);

	return (
		<View testID={`visit-block-${dateKey}`}>
			<View>
				<PhotoGallery
					photos={photos}
					title={displayTitle}
					scrimHeight={hasHeroPhoto && heroTopInset > 0 ? heroTopInset + 72 : 0}
				/>
				{/* 사진 우상단 오버레이 — 제목 중앙 정렬을 밀지 않는다. 사진 위에서도 읽히게 반투명 면을 깐다 */}
				<View className="absolute right-4" style={{ top: heroTopInset + 8 }}>
					<Pressable
						ref={dotsRef}
						onPress={handleOpenMenu}
						hitSlop={4}
						accessibilityLabel={t('diary.visit_more_a11y')}
						accessibilityRole="button"
						className={cn(
							'h-11 w-11 items-center justify-center rounded-full',
							hasHeroPhoto ? 'bg-black/50' : 'bg-white/90',
						)}
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons
							name="ellipsis-horizontal"
							size={20}
							color={hasHeroPhoto ? colors.white : colors.ink}
						/>
					</Pressable>
				</View>
			</View>

			<View className="mt-6 items-center px-8">
				<Text
					numberOfLines={3}
					accessibilityRole="header"
					className="text-center font-pretendard-semibold text-[24px] leading-[32px] text-ink"
				>
					{displayTitle}
				</Text>

				{creditLine ? (
					<Text
						numberOfLines={2}
						className="mt-2 text-center font-pretendard-regular text-[14px] leading-[20px] text-gray600"
					>
						{creditLine} · {dateLabel}
					</Text>
				) : (
					<Text
						numberOfLines={2}
						className="mt-2 text-center font-pretendard-regular text-[14px] leading-[20px] text-gray600"
					>
						{dateLabel}
					</Text>
				)}
			</View>

			{hasReview && (
				<View className="mt-10 px-6">
					{/* 관람 노트 — 잡지 기사 머리말처럼 가는 선 위에 작은 제목과 별점을 한 줄로 둔다 */}
					{/* 메모가 없으면 아래에 이어지는 구분선과 겹쳐 두 줄이 되니 머리말 선은 뺀다 */}
					<VisitSectionHeader
						label={t('diary.visit_notes')}
						divider={Boolean(memo)}
						right={
							hasRating && (
								// 읽기 전용 별 5개가 버튼으로 따로 읽히지 않게 별점 + 점수를 하나의 요소로 묶는다
								<View
									accessible
									accessibilityRole="text"
									accessibilityLabel={t('diary.visit_rating_a11y', { rating: ratingText })}
									className="flex-row items-center gap-2"
								>
									<StarRating value={rating} onChange={() => {}} disabled size={18} tone="light" />
									<Text className="font-pretendard-medium text-[12px] text-gray600">
										{`${ratingText} / 5`}
									</Text>
								</View>
							)
						}
					/>

					{memo && (
						<View className="pt-6">
							{/* 장식용 여는 따옴표 — 스크린리더에는 읽히지 않는다 */}
							<Text
								accessibilityElementsHidden
								importantForAccessibility="no"
								className="-mb-5 font-hahmlet-bold text-[56px] leading-[56px] text-editorial/40"
							>
								“
							</Text>
							<Text
								lineBreakStrategyIOS="hangul-word"
								className="font-pretendard-regular text-[16px] leading-[30px] text-gray800"
							>
								{memo}
							</Text>
						</View>
					)}
				</View>
			)}

			{listenedItems.length > 0 && (
				<View className="mx-6 mt-10">
					<VisitSectionHeader
						label={t('diary.visit_listened')}
						divider
						right={
							<Text className="font-pretendard-regular text-[12px] text-gray600">
								{t('diary.visit_listened_count', { count: listenedItems.length })}
							</Text>
						}
					/>
					{listenedItems.map((item, index) => (
						<ListenedArtworkRow
							key={item.title}
							index={index}
							title={item.title}
							playable={playableByTitle.has(item.title)}
							chatMessages={chatByTitle.get(item.title) ?? []}
							onPlay={() => handlePlayListened(item)}
						/>
					))}
				</View>
			)}

			{otherChatItems.length > 0 && (
				<View className="mx-6 mt-10">
					<VisitSectionHeader label={t('diary.visit_chats')} divider />
					{otherChatItems.map((item) => (
						<View key={item.id} className="mt-5">
							<Text
								numberOfLines={1}
								className="mb-2 font-pretendard-semibold text-[14px] text-ink"
							>
								{`『${item.title}』${item.artist ? ` - ${item.artist}` : ''}`}
							</Text>
							<View className="rounded-2xl bg-surface-neutral p-3">
								<ArtworkChatThread messages={item.chatMessages ?? []} />
							</View>
						</View>
					))}
				</View>
			)}

			{/* 수정/삭제 메뉴 — 점 세 개 바로 아래에 뜬다. 배경 터치 영역은 메뉴의 부모가 아니라 형제로 둔다:
			    Pressable이 메뉴를 감싸면 iOS가 하나의 접근성 요소로 묶어 수정/삭제 항목이 보조기기에 안 잡힌다 */}
			<Modal visible={menuOpen} transparent animationType="fade" onRequestClose={handleClose}>
				<View className="flex-1">
					<Pressable
						className="absolute inset-0"
						onPress={handleClose}
						accessibilityRole="button"
						accessibilityLabel={t('diary.visit_menu_close_a11y')}
					/>
					<View
						className="absolute overflow-hidden rounded-2xl border-[0.5px] border-divider bg-white shadow-chip"
						style={{ top: menuAnchor.top, right: menuAnchor.right }}
					>
						<Pressable
							onPress={handleEditMemo}
							className="min-h-11 flex-row items-center gap-2 px-4 py-3"
							accessibilityRole="button"
							accessibilityLabel={t('diary.visit_edit_a11y')}
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons name="pencil-outline" size={16} color={colors.ink} />
							<Text className="font-pretendard-medium text-[14px] text-ink">
								{t('common.edit')}
							</Text>
						</Pressable>
						<View className="h-hairline bg-divider" />
						<Pressable
							onPress={handleDelete}
							className="min-h-11 flex-row items-center gap-2 px-4 py-3"
							accessibilityRole="button"
							accessibilityLabel={t('diary.visit_delete_a11y')}
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons name="trash-outline" size={16} color={colors.error} />
							<Text className="font-pretendard-medium text-[14px] text-error">
								{t('common.delete')}
							</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
		</View>
	);
}
