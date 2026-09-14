import { useCallback, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { IconButton } from '@/src/components/common/IconButton';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import {
	PERFORATION_HEIGHT,
	STUB_HEIGHT,
	VisitTicketFooter,
} from '@/src/components/archive/VisitTicketFooter';
import { VisitTicketProgramRow } from '@/src/components/archive/VisitTicketProgramRow';
import type { Exhibition } from '@/src/data/exhibitions';
import type { ListenedItem } from '@/src/store/visitStore';
import { barcodeWidths } from '@/src/utils/visitTicket';
import { cn } from '@/src/lib/cn';

const TICKET_MIN_HEIGHT = 600;
const TICKET_BODY_HEIGHT = TICKET_MIN_HEIGHT - STUB_HEIGHT - PERFORATION_HEIGHT;

const ticketShellStyle = {
	height: TICKET_MIN_HEIGHT,
	minHeight: TICKET_MIN_HEIGHT,
	flexDirection: 'column' as const,
};

// 차분한 플립: 여유 있는 시간 + 부드러운 가감속
const FLIP_TIMING = { duration: 650, easing: Easing.inOut(Easing.cubic) };
/** 좌우 드래그 이 거리만큼이면 한 면(0↔1) 전환 */
const FLIP_DRAG_PX = 280;

interface VisitTicketProps {
	exhibition: Exhibition;
	listenedTitles: string[];
	/** visit store 우선; 없으면 screen에서 title-only fallback */
	listenedItems: ListenedItem[];
	dateKey: string;
	dateLabel: string;
	/** 확정 큐에서 남긴 서명 — 앞면 관람 완료 도장 뒤에 표시 */
	signatureSvg?: string;
	/** 관람 시간 — 뒷면 스텁 아랫부분에 표시 */
	visitedAt?: { start: string; end: string };
	/** 해설 텍스트가 있는 작품만 재생 가능 */
	playableTitles?: string[];
	onPlayListened?: (item: ListenedItem) => void;
	/** 티켓 인증 사진 — 있으면 포스터 대신 앞면 메인으로 쓴다 */
	ticketPhotoUri?: string;
	/** 티켓 인증 때 올린 현장 사진 — 있으면 뒷면을 관람 후기 그리드로 바꾼다 */
	venuePhotos?: string[];
}

// 관람 기록 입장권. 앞면 탭 → 뒷면(프로그램). 뒷면은 관람 프로그램만 표시.
export function VisitTicket({
	exhibition,
	listenedTitles,
	listenedItems,
	dateKey,
	dateLabel,
	signatureSvg,
	visitedAt,
	playableTitles,
	onPlayListened,
	ticketPhotoUri,
	venuePhotos,
}: VisitTicketProps) {
	const [flipped, setFlipped] = useState(false);
	const [photoGridWidth, setPhotoGridWidth] = useState(0);
	const [previewUri, setPreviewUri] = useState<string | null>(null);

	const rotation = useSharedValue(0);
	const dragStartRotation = useSharedValue(0);
	const previewScale = useSharedValue(1);
	const previewSavedScale = useSharedValue(1);
	const previewX = useSharedValue(0);
	const previewY = useSharedValue(0);
	const previewSavedX = useSharedValue(0);
	const previewSavedY = useSharedValue(0);

	const applyFlipped = useCallback((toBack: boolean) => setFlipped(toBack), []);

	const snapTo = useCallback(
		(toBack: boolean) => {
			rotation.set(withTiming(toBack ? 1 : 0, FLIP_TIMING));
			applyFlipped(toBack);
		},
		[applyFlipped, rotation],
	);

	const flipPan = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetX([-14, 14])
				.failOffsetY([-22, 22])
				.onBegin(() => {
					dragStartRotation.set(rotation.value);
				})
				.onUpdate((e) => {
					const next = dragStartRotation.value - e.translationX / FLIP_DRAG_PX;
					rotation.set(Math.min(1, Math.max(0, next)));
				})
				.onEnd((e) => {
					const projected = rotation.value - e.velocityX / 2800;
					const toBack = projected > 0.5;
					rotation.set(withTiming(toBack ? 1 : 0, FLIP_TIMING));
					scheduleOnRN(applyFlipped, toBack);
				}),
		[applyFlipped, dragStartRotation, rotation],
	);

	// 뒷면 프로그램 탭이 티켓 플립 탭과 같이 먹지 않게 — 앞면에서만 탭으로 뒤집는다.
	const flipTap = useMemo(
		() =>
			Gesture.Tap()
				.enabled(!flipped)
				.maxDuration(280)
				.onEnd(() => {
					const toBack = rotation.value <= 0.5;
					rotation.set(withTiming(toBack ? 1 : 0, FLIP_TIMING));
					scheduleOnRN(applyFlipped, toBack);
				}),
		[applyFlipped, flipped, rotation],
	);

	const flipGesture = useMemo(() => Gesture.Race(flipPan, flipTap), [flipPan, flipTap]);

	const resetPreviewZoom = () => {
		previewScale.set(1);
		previewSavedScale.set(1);
		previewX.set(0);
		previewY.set(0);
		previewSavedX.set(0);
		previewSavedY.set(0);
	};

	const closePreview = () => {
		resetPreviewZoom();
		setPreviewUri(null);
	};

	const previewPinch = useMemo(
		() =>
			Gesture.Pinch()
				.onUpdate((event) => {
					previewScale.set(Math.min(4, Math.max(1, previewSavedScale.value * event.scale)));
				})
				.onEnd(() => {
					previewSavedScale.set(previewScale.value);
				}),
		[previewScale, previewSavedScale],
	);

	const previewPan = useMemo(
		() =>
			Gesture.Pan()
				.onUpdate((event) => {
					if (previewSavedScale.value <= 1) return;
					previewX.set(previewSavedX.value + event.translationX);
					previewY.set(previewSavedY.value + event.translationY);
				})
				.onEnd(() => {
					previewSavedX.set(previewX.value);
					previewSavedY.set(previewY.value);
				}),
		[previewSavedScale, previewX, previewY, previewSavedX, previewSavedY],
	);

	const previewGestures = useMemo(
		() => Gesture.Simultaneous(previewPinch, previewPan),
		[previewPinch, previewPan],
	);

	const previewImageStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: previewX.value },
			{ translateY: previewY.value },
			{ scale: previewScale.value },
		],
	}));

	const frontStyle = useAnimatedStyle(() => ({
		transform: [
			{ perspective: 1200 },
			{ rotateY: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` },
		],
		backfaceVisibility: 'hidden',
	}));
	const backStyle = useAnimatedStyle(() => ({
		transform: [
			{ perspective: 1200 },
			{ rotateY: `${interpolate(rotation.value, [0, 1], [-180, -360])}deg` },
		],
		backfaceVisibility: 'hidden',
	}));

	const bars = barcodeWidths(dateKey);
	const ticketNo = `NO. ${dateKey.replaceAll('-', '')}`;
	const isTicketVerified = Boolean(ticketPhotoUri) || (venuePhotos?.length ?? 0) > 0;
	const photoTileSize = photoGridWidth > 0 ? (photoGridWidth - 8) / 2 : 0;
	const backHint = isTicketVerified
		? '좌우로 밀거나 탭하면 관람 후기 보기'
		: '좌우로 밀거나 탭하면 프로그램 보기';
	const flipHint = flipped ? '← 밀거나 탭하면 앞면 보기' : backHint;
	const backA11yLabel = isTicketVerified ? '티켓 뒷면 관람 후기 보기' : '티켓 뒷면 프로그램 보기';
	const flipA11yLabel = flipped ? '티켓 앞면 보기' : backA11yLabel;
	const frontCells = isTicketVerified
		? [
				{ label: '장소', value: exhibition.venue || '—' },
				{ label: '날짜', value: dateLabel.split(' ')[0] },
			]
		: [
				{ label: '장소', value: exhibition.venue },
				{ label: '날짜', value: dateLabel.split(' ')[0] },
				{ label: '들은 해설', value: `${listenedTitles.length}개` },
			];
	const cardShadow = {
		shadowColor: '#000000',
		shadowOpacity: 0.35,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 6 },
	} as const;

	return (
		<View className="h-auto">
			<GestureDetector gesture={flipGesture}>
				<View style={{ height: TICKET_MIN_HEIGHT, minHeight: TICKET_MIN_HEIGHT }}>
					{/* 앞면 */}
					<Animated.View
						className="overflow-hidden rounded-3xl bg-white"
						pointerEvents={flipped ? 'none' : 'box-none'}
						style={[cardShadow, frontStyle, ticketShellStyle, { zIndex: flipped ? 0 : 2 }]}
					>
						<View style={{ height: TICKET_BODY_HEIGHT }}>
							<View className="flex-1 min-h-0 w-full bg-image-placeholder">
								<ImageFallback
									heroImageUri={ticketPhotoUri ?? exhibition.heroImageUri}
									posterImage={exhibition.posterImage}
									className="h-full w-full bg-image-placeholder"
									iconSize={100}
									resizeMode="cover"
									useImageProxy
								/>
							</View>

							<View className="px-6 pt-5">
								<Text className="text-[10px] tracking-[3px] text-gray500 font-pretendard-semibold">
									EXHIBITION
								</Text>
								<Text
									className="mt-1.5 text-[24px] leading-[32px] text-gray900 font-hahmlet-bold"
									numberOfLines={2}
								>
									{exhibition.title}
								</Text>
							</View>

							{/* 정보 그리드 */}
							<View className="mb-4 mt-5 flex-row px-6">
								{frontCells.map((cell) => (
									<View key={cell.label} className="flex-1 pr-2">
										<Text className="text-[11px] text-gray500 font-pretendard-medium">
											{cell.label}
										</Text>
										<Text
											className="mt-1 text-[14px] text-gray900 font-pretendard-semibold"
											numberOfLines={2}
										>
											{cell.value}
										</Text>
									</View>
								))}
							</View>
						</View>

						<VisitTicketFooter
							variant="front"
							bars={bars}
							ticketNo={ticketNo}
							signatureSvg={signatureSvg}
						/>
					</Animated.View>

					{/* 뒷면: 몰입은 오늘의 프로그램, 티켓 인증은 관람 후기 */}
					<Animated.View
						className={cn(
							'overflow-hidden rounded-3xl bg-white absolute inset-0',
							flipped ? 'z-[2]' : 'z-0',
						)}
						pointerEvents={flipped ? 'box-none' : 'none'}
						style={[cardShadow, backStyle, ticketShellStyle]}
					>
						<View style={{ height: TICKET_BODY_HEIGHT }}>
							<ScrollView
								className="flex-1 min-h-0"
								showsVerticalScrollIndicator={false}
								nestedScrollEnabled
								contentContainerClassName="pt-4 pb-2 flex-grow"
							>
								<View className="px-6 pt-2 pb-2">
									{isTicketVerified ? (
										<>
											<Text className="text-[15px] font-pretendard-semibold text-gray900 mb-3">
												관람 후기
											</Text>
											<View
												className="flex-row flex-wrap gap-2"
												onLayout={(event) => setPhotoGridWidth(event.nativeEvent.layout.width)}
											>
												{(venuePhotos ?? []).map((uri) => (
													<Pressable
														key={uri}
														onPress={() => {
															resetPreviewZoom();
															setPreviewUri(uri);
														}}
														accessibilityRole="button"
														accessibilityLabel="관람 후기 사진 크게 보기"
														style={{ width: photoTileSize, height: photoTileSize }}
													>
														<Image
															source={{ uri }}
															className="h-full w-full rounded-2xl bg-bg-tonal"
															accessibilityIgnoresInvertColors
														/>
													</Pressable>
												))}
											</View>
										</>
									) : (
										<>
											<View className="flex-row items-baseline justify-between mb-1">
												<Text className="text-[15px] font-pretendard-semibold text-gray900">
													오늘의 프로그램
												</Text>
												{listenedItems.length > 0 && (
													<Text className="text-[12px] font-pretendard-regular text-gray500">
														{listenedItems.length}작품
													</Text>
												)}
											</View>
											<Text className="text-[11px] mb-3 font-pretendard-medium text-gray500">
												{dateLabel}
											</Text>

											{listenedItems.length > 0 ? (
												listenedItems.map((item, index) => (
													<VisitTicketProgramRow
														key={`${item.title}-${index}`}
														index={index}
														item={item}
														blockGestures={[flipPan, flipTap]}
														onPress={
															onPlayListened && playableTitles?.includes(item.title)
																? () => onPlayListened(item)
																: undefined
														}
													/>
												))
											) : (
												<View className="py-6">
													<Text className="text-[14px] text-center font-pretendard-medium text-gray900">
														이날 들은 작품이 없어요
													</Text>
												</View>
											)}
										</>
									)}
								</View>
							</ScrollView>
						</View>

						<VisitTicketFooter
							variant="back"
							bars={bars}
							ticketNo={ticketNo}
							visitedAt={visitedAt}
						/>
					</Animated.View>
				</View>
			</GestureDetector>

			{/* 페이지 도트: 앞면/뒷면 표시 */}
			<View className="mt-4 flex-row items-center justify-center gap-1.5">
				<View
					className={cn(
						'h-1.5 rounded-full',
						flipped ? 'w-[6px] bg-[#bbb9b7]' : 'w-[18px] bg-bg-light',
					)}
				/>
				<View
					className={cn(
						'h-1.5 rounded-full',
						flipped ? 'w-[18px] bg-bg-light' : 'w-[6px] bg-[#bbb9b7]',
					)}
				/>
			</View>

			<Pressable
				onPress={() => snapTo(!flipped)}
				accessibilityRole="button"
				accessibilityLabel={flipA11yLabel}
				className="mt-2"
				style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
			>
				<Text className="text-center text-[12px] font-pretendard-regular text-white/60">
					{flipHint}
				</Text>
			</Pressable>

			<Modal
				visible={previewUri !== null}
				transparent
				animationType="fade"
				onRequestClose={closePreview}
			>
				<GestureHandlerRootView className="flex-1 bg-black">
					<GestureDetector gesture={previewGestures}>
						<Animated.View className="flex-1 items-center justify-center">
							{previewUri && (
								<Animated.Image
									source={{ uri: previewUri }}
									className="w-full h-full"
									resizeMode="contain"
									style={previewImageStyle}
								/>
							)}
						</Animated.View>
					</GestureDetector>
					<IconButton
						onPress={closePreview}
						icon="close"
						variant="translucent"
						size="sm"
						hitSlop={12}
						accessibilityLabel="사진 닫기"
						className="absolute top-14 right-5"
					/>
				</GestureHandlerRootView>
			</Modal>
		</View>
	);
}
