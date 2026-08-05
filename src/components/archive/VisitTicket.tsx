import { useCallback, useMemo, useState } from 'react';
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import type { Exhibition } from '@/src/data/exhibitions';
import type { ListenedItem } from '@/src/store/visitStore';
import { cn } from '@/src/lib/cn';

// 다이어리 화면의 어두운 그라데이션(#0C0A09→#171412) 중간값 — 절취선 노치가 뚫린 것처럼 보이게 함
const NOTCH = '#110F0E';
const INK = '#1C1917';
const STAMP = '#C2410C';
const STUB_HEIGHT = 112;
/** 절취선 행(노치 20 + 점선) — 앞·뒤 동일 Y 고정용 */
const PERFORATION_HEIGHT = 24;
const TICKET_MIN_HEIGHT = 640;
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
	memo: string;
	onMemoChange: (text: string) => void;
}

// dateKey 기반 고정 바코드 막대 폭 (렌더마다 동일)
function barcodeWidths(dateKey: string): number[] {
	const seed = dateKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
	return Array.from({ length: 28 }, (_, i) => ((seed + i * 7) % 3) + 1);
}

// 절취선: 양옆 노치 + 점선
function Perforation() {
	return (
		<View
			className='flex-row items-center'
			style={{ height: PERFORATION_HEIGHT }}
		>
			<View
				className='rounded-full w-[20px] h-[20px] ml-[-10px]'
				style={{ backgroundColor: NOTCH }}
			/>
			<View className='mx-2 flex-1 border-b-[1.5px] border-dashed border-[#E7E5E4]' />
			<View
				className='rounded-full w-[20px] h-[20px] mr-[-10px]'
				style={{ backgroundColor: NOTCH }}
			/>
		</View>
	);
}

function TicketStubFront({
	bars,
	ticketNo,
	dateKey,
}: {
	bars: number[];
	ticketNo: string;
	dateKey: string;
}) {
	return (
		<View
			className='flex-row items-center justify-between px-6'
			style={{ height: STUB_HEIGHT }}
		>
			<View>
				<View className='flex-row items-end' accessibilityLabel='장식용 바코드'>
					{bars.map((w, i) => (
						<View
							key={i}
							className={cn('mr-0.5', i % 4 === 0 ? 'h-[30px]' : 'h-[24px]')}
							style={{
								width: w,
								backgroundColor: INK,
							}}
						/>
					))}
				</View>
				<Text className='mt-1.5 text-[10px] tracking-[4px] text-[#78716C] font-pretendard-medium'>
					{ticketNo}
				</Text>
			</View>
			<VisitStamp dateKey={dateKey} />
		</View>
	);
}

function TicketStubBack({ ticketNo }: { ticketNo: string }) {
	return (
		<View
			className='flex-row items-center justify-between px-6'
			style={{ height: STUB_HEIGHT }}
		>
			<View>
				<Text className='text-[10px] tracking-[3px] text-[#A8A29E] font-pretendard-semibold'>
					MUSEUM TICKET
				</Text>
				<Text className='mt-1 text-[10px] tracking-[3px] text-[#D6D3D1] font-pretendard-semibold'>
					ADMIT ONE
				</Text>
			</View>
			<Text className='text-[10px] tracking-[4px] text-[#78716C] font-pretendard-medium'>
				{ticketNo}
			</Text>
		</View>
	);
}

function TicketFooter({
	variant,
	bars,
	ticketNo,
	dateKey,
}: {
	variant: 'front' | 'back';
	bars: number[];
	ticketNo: string;
	dateKey: string;
}) {
	return (
		<>
			<Perforation />
			{variant === 'front' ? (
				<TicketStubFront bars={bars} ticketNo={ticketNo} dateKey={dateKey} />
			) : (
				<TicketStubBack ticketNo={ticketNo} />
			)}
		</>
	);
}

// 코드로 그린 관람 완료 도장
function VisitStamp({ dateKey }: { dateKey: string }) {
	return (
		<View
			className='items-center justify-center rounded-full w-[78px] h-[78px] rotate-[-14deg] opacity-85'
			style={{
				borderWidth: 2.5,
				borderColor: STAMP,
			}}
		>
			<View
				className='items-center justify-center rounded-full w-[66px] h-[66px]'
				style={{ borderWidth: 1, borderColor: STAMP }}
			>
				<Text className='text-[13px] font-hahmlet-bold' style={{ color: STAMP }}>
					관람 완료
				</Text>
				<Text
					className='mt-0.5 tracking-[1px] text-[8px] font-pretendard-semibold'
					style={{ color: STAMP }}
				>
					{dateKey.replaceAll('-', '.')}
				</Text>
			</View>
		</View>
	);
}

function ProgramRow({ index, item }: { index: number; item: ListenedItem }) {
	return (
		<View
			className='flex-row items-center py-3 border-b border-[#F5F5F4]'
			accessibilityLabel={`${index + 1}번, ${item.title}`}
		>
			<Text className='w-6 text-[13px] font-pretendard-medium text-[#A8A29E]'>
				{index + 1}
			</Text>
			<View className='overflow-hidden rounded-lg mr-3 w-[44px] h-[44px] bg-[#E5E1D8]'>
				{item.imageUrl ? (
					<Image
						source={{ uri: item.imageUrl }}
						resizeMode='cover'
						className='h-full w-full'
					/>
				) : (
					<EmptyImagePlaceholder
						className='h-full w-full items-center justify-center'
						iconSize={20}
					/>
				)}
			</View>
			<View className='flex-1 min-w-0'>
				<Text
					className='text-[14px] leading-[19px] font-pretendard-semibold'
					numberOfLines={2}
					style={{ color: INK }}
				>
					{item.title}
				</Text>
				{item.descriptionPreview ? (
					<Text
						className='text-[12px] mt-1 leading-[17px] font-pretendard-regular text-[#78716C]'
						numberOfLines={1}
					>
						{item.descriptionPreview}
					</Text>
				) : null}
			</View>
		</View>
	);
}

function TicketVisitMemo({
	memo,
	onMemoChange,
}: {
	memo: string;
	onMemoChange: (text: string) => void;
}) {
	return (
		<View className='mt-5 pt-5 border-t border-[#E7E5E4]'>
			<Text
				className='text-[14px] mb-1 font-pretendard-semibold'
				style={{ color: INK }}
			>
				나의 관람 메모
			</Text>
			<Text className='text-[12px] mb-3 leading-[18px] font-pretendard-regular text-[#78716C]'>
				직접 적은 글이 이 티켓에 남아요
			</Text>
			<TextInput
				value={memo}
				onChangeText={onMemoChange}
				placeholder='오늘 기억하고 싶은 것을 적어보세요'
				placeholderTextColor='#A8A29E'
				multiline
				maxLength={400}
				accessibilityLabel='관람 메모 입력'
				className='h-[96px] rounded-xl border border-[#E7E5E4] p-3.5 py-3 bg-[#FAFAF9] text-[14px] leading-[22px] text-[#44403C] font-pretendard-regular'
				textAlignVertical='top'
			/>
		</View>
	);
}

// 관람 기록 입장권. 앞면 탭 → 뒷면(프로그램·메모). 뒷면은 입력 가능.
export function VisitTicket({
	exhibition,
	listenedTitles,
	listenedItems,
	dateKey,
	dateLabel,
	memo,
	onMemoChange,
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
		<View>
			<GestureDetector gesture={flipGesture}>
				<View style={{ height: TICKET_MIN_HEIGHT, minHeight: TICKET_MIN_HEIGHT }}>
					{/* 앞면 */}
					<Animated.View
						className='overflow-hidden rounded-3xl bg-white'
						pointerEvents={flipped ? 'none' : 'box-none'}
						style={[
							cardShadow,
							frontStyle,
							ticketShellStyle,
							{ zIndex: flipped ? 0 : 2 },
						]}
					>
						<View className='flex flex-col' style={{ height: TICKET_BODY_HEIGHT }}>
							<View className='flex-1 min-h-0 w-full'>
								{exhibition.heroImageUri || exhibition.posterImage ? (
									<Image
										source={
											exhibition.heroImageUri
												? { uri: exhibition.heroImageUri }
												: exhibition.posterImage
										}
										resizeMode='cover'
										style={{ width: '100%', height: '100%' }}
									/>
								) : (
									<EmptyImagePlaceholder
										className='h-full w-full items-center justify-center bg-[#E5E1D8]'
										iconSize={100}
									/>
								)}
							</View>

							<View className='px-6 pt-5'>
								<Text className='text-[10px] tracking-[3px] text-[#A8A29E] font-pretendard-semibold'>
									EXHIBITION
								</Text>
								<Text
									className='mt-1.5 text-[24px] leading-[32px] text-[#1C1917] font-hahmlet-bold'
									numberOfLines={2}
								>
									{exhibition.title}
								</Text>
							</View>

							{/* 정보 그리드 */}
							<View className='mb-4 mt-5 flex-row px-6'>
								{[
									{ label: '장소', value: exhibition.venue },
									{ label: '날짜', value: dateLabel.split(' ')[0] },
									{ label: '들은 해설', value: `${listenedTitles.length}개` },
								].map((cell) => (
									<View key={cell.label} className='flex-1 pr-2'>
										<Text className='text-[11px] text-[#A8A29E] font-pretendard-medium'>
											{cell.label}
										</Text>
										<Text
											className='mt-1 text-[14px] text-[#1C1917] font-pretendard-semibold'
											numberOfLines={2}
										>
											{cell.value}
										</Text>
									</View>
								))}
							</View>
						</View>

						<TicketFooter
							variant='front'
							bars={bars}
							ticketNo={ticketNo}
							dateKey={dateKey}
						/>
					</Animated.View>

					{/* 뒷면: 프로그램 + 나의 메모 (플립 시 입력 가능) */}
					<Animated.View
						className='overflow-hidden rounded-3xl bg-white'
						pointerEvents={flipped ? 'box-none' : 'none'}
						style={[
							cardShadow,
							backStyle,
							StyleSheet.absoluteFill,
							ticketShellStyle,
							{ zIndex: flipped ? 2 : 0 },
						]}
					>
						<View className='flex flex-col' style={{ height: TICKET_BODY_HEIGHT }}>
							<Pressable
								onPress={() => snapTo(false)}
								className='px-6 pt-4 pb-1 self-start'
								accessibilityRole='button'
								accessibilityLabel='티켓 앞면 보기'
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							>
								<Text className='text-[13px] font-pretendard-medium text-[#78716C]'>
									← 앞면 보기
								</Text>
							</Pressable>
							<ScrollView
								style={{ flex: 1, minHeight: 0 }}
								showsVerticalScrollIndicator={false}
								nestedScrollEnabled
								contentContainerStyle={{ paddingBottom: 8, flexGrow: 1 }}
							>
								<View className='px-6 pt-2 pb-2'>
									<View className='flex-row items-baseline justify-between mb-1'>
										<Text
											className='text-[15px] font-pretendard-semibold'
											style={{ color: INK }}
										>
											오늘의 프로그램
										</Text>
										{listenedItems.length > 0 ? (
											<Text className='text-[12px] font-pretendard-regular text-[#A8A29E]'>
												{listenedItems.length}작품
											</Text>
										) : null}
									</View>
									<Text className='text-[11px] mb-3 font-pretendard-medium text-[#A8A29E]'>
										{dateLabel}
									</Text>

									{listenedItems.length > 0 ? (
										listenedItems.map((item, index) => (
											<ProgramRow
												key={`${item.title}-${index}`}
												index={index}
												item={item}
											/>
										))
									) : (
										<View className='py-6'>
											<Text
												className='text-[14px] text-center font-pretendard-medium'
												style={{ color: INK }}
											>
												이날 들은 작품이 없어요
											</Text>
											<Text className='text-[13px] text-center mt-2 leading-[20px] font-pretendard-regular text-[#78716C]'>
												헤더의 ♪에서 목록을 확인할 수 있어요
											</Text>
										</View>
									)}

									<TicketVisitMemo memo={memo} onMemoChange={onMemoChange} />
								</View>
							</ScrollView>
						</View>

						<TicketFooter
							variant='back'
							bars={bars}
							ticketNo={ticketNo}
							dateKey={dateKey}
						/>
					</Animated.View>
				</View>
			</GestureDetector>

			{/* 페이지 도트: 앞면/뒷면 표시 */}
			<View className='mt-4 flex-row items-center justify-center gap-1.5'>
				<View
					className={cn(
						'h-1.5 rounded-full',
						flipped ? 'w-[6px] bg-[#bbb9b7]' : 'w-[18px] bg-[#F8F6F2]',
					)}
				/>
				<View
					className={cn(
						'h-1.5 rounded-full',
						flipped ? 'w-[18px] bg-[#F8F6F2]' : 'w-[6px] bg-[#bbb9b7]',
					)}
				/>
			</View>

			<Pressable
				onPress={() => snapTo(!flipped)}
				accessibilityRole='button'
				accessibilityLabel={flipped ? '티켓 앞면 보기' : '티켓 뒷면 프로그램 보기'}
				className='mt-2'
				style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
			>
				<Text className='text-center text-[12px] font-pretendard-regular text-[#ffffff66]'>
					{flipped
						? '← 밀거나 탭하면 앞면 · 앞면 보기'
						: '좌우로 밀거나 탭하면 프로그램·메모'}
				</Text>
			</Pressable>
		</View>
	);
}
