import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
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
}

// 관람 기록 입장권. 앞면 탭 → 뒷면(프로그램). 뒷면은 관람 프로그램만 표시.
export function VisitTicket({
	exhibition,
	listenedTitles,
	listenedItems,
	dateKey,
	dateLabel,
}: VisitTicketProps) {
	const [flipped, setFlipped] = useState(false);
	const rotation = useSharedValue(0);
	const dragStartRotation = useSharedValue(0);

	const applyFlipped = useCallback((toBack: boolean) => {
		setFlipped(toBack);
	}, []);

	const snapTo = useCallback(
		(toBack: boolean) => {
			rotation.value = withTiming(toBack ? 1 : 0, FLIP_TIMING);
			applyFlipped(toBack);
		},
		[applyFlipped, rotation],
	);

	const flipGesture = useMemo(
		() =>
			Gesture.Race(
				Gesture.Pan()
					.activeOffsetX([-14, 14])
					.failOffsetY([-22, 22])
					.onBegin(() => {
						dragStartRotation.value = rotation.value;
					})
					.onUpdate((e) => {
						const next = dragStartRotation.value - e.translationX / FLIP_DRAG_PX;
						rotation.value = Math.min(1, Math.max(0, next));
					})
					.onEnd((e) => {
						const projected = rotation.value - e.velocityX / 2800;
						const toBack = projected > 0.5;
						rotation.value = withTiming(toBack ? 1 : 0, FLIP_TIMING);
						runOnJS(applyFlipped)(toBack);
					}),
				Gesture.Tap()
					.maxDuration(280)
					.onEnd(() => {
						const toBack = rotation.value <= 0.5;
						rotation.value = withTiming(toBack ? 1 : 0, FLIP_TIMING);
						runOnJS(applyFlipped)(toBack);
					}),
			),
		[applyFlipped, dragStartRotation, rotation],
	);

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
						<View className="flex flex-col" style={{ height: TICKET_BODY_HEIGHT }}>
							<View className="flex-1 min-h-0 w-full">
								<ImageFallback
									heroImageUri={exhibition.heroImageUri}
									posterImage={exhibition.posterImage}
									className="h-full w-full bg-image-placeholder"
									iconSize={100}
									resizeMode="cover"
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
								{[
									{ label: '장소', value: exhibition.venue },
									{ label: '날짜', value: dateLabel.split(' ')[0] },
									{ label: '들은 해설', value: `${listenedTitles.length}개` },
								].map((cell) => (
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

						<VisitTicketFooter variant="front" bars={bars} ticketNo={ticketNo} />
					</Animated.View>

					{/* 뒷면: 프로그램 + 나의 메모 (플립 시 입력 가능) */}
					<Animated.View
						className="overflow-hidden rounded-3xl bg-white"
						pointerEvents={flipped ? 'box-none' : 'none'}
						style={[
							cardShadow,
							backStyle,
							StyleSheet.absoluteFill,
							ticketShellStyle,
							{ zIndex: flipped ? 2 : 0 },
						]}
					>
						<View className="flex flex-col" style={{ height: TICKET_BODY_HEIGHT }}>
							<ScrollView
								className="flex-1 min-h-0"
								showsVerticalScrollIndicator={false}
								nestedScrollEnabled
								contentContainerStyle={{
									paddingTop: 16,
									paddingBottom: 8,
									flexGrow: 1,
								}}
							>
								<View className="px-6 pt-2 pb-2">
									<View className="flex-row items-baseline justify-between mb-1">
										<Text className="text-[15px] font-pretendard-semibold text-gray900">
											오늘의 프로그램
										</Text>
										{listenedItems.length > 0 ? (
											<Text className="text-[12px] font-pretendard-regular text-gray500">
												{listenedItems.length}작품
											</Text>
										) : null}
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
											/>
										))
									) : (
										<View className="py-6">
											<Text className="text-[14px] text-center font-pretendard-medium text-gray900">
												이날 들은 작품이 없어요
											</Text>
										</View>
									)}
								</View>
							</ScrollView>
						</View>

						<VisitTicketFooter variant="back" bars={bars} ticketNo={ticketNo} />
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
				accessibilityLabel={flipped ? '티켓 앞면 보기' : '티켓 뒷면 프로그램 보기'}
				className="mt-2"
				style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
			>
				<Text className="text-center text-[12px] font-pretendard-regular text-white/60">
					{flipped ? '← 밀거나 탭하면 앞면 보기' : '좌우로 밀거나 탭하면 프로그램 보기'}
				</Text>
			</Pressable>
		</View>
	);
}
