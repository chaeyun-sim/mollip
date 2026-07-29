import { useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import type { Exhibition } from '@/src/data/exhibitions';

// 다이어리 화면의 어두운 그라데이션(#0C0A09→#171412) 중간값 — 절취선 노치가 뚫린 것처럼 보이게 함
const NOTCH = '#110F0E';
const INK = '#1C1917';
const STAMP = '#C2410C';
const STUB_HEIGHT = 112; // 앞/뒷면 절취선 위치를 맞추는 하단 스텁 고정 높이
const TICKET_MIN_HEIGHT = 640; // 뒷면 일기(6~7줄)가 잘리지 않는 최소 높이

// 차분한 플립: 여유 있는 시간 + 부드러운 가감속
const FLIP_TIMING = { duration: 650, easing: Easing.inOut(Easing.cubic) };

interface VisitTicketProps {
	exhibition: Exhibition;
	listenedTitles: string[];
	dateKey: string; // YYYY-MM-DD, 티켓 번호 생성에 사용
	dateLabel: string;
	// 뒷면 AI 일기
	diaryText?: string;
	isStreaming?: boolean;
	hasError?: boolean;
	onGenerate?: () => void;
}

// dateKey 기반 고정 바코드 막대 폭 (렌더마다 동일)
function barcodeWidths(dateKey: string): number[] {
	const seed = dateKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
	return Array.from({ length: 28 }, (_, i) => ((seed + i * 7) % 3) + 1);
}

// 절취선: 양옆 노치 + 점선
function Perforation() {
	return (
		<View className='flex-row items-center'>
			<View
				className='rounded-full'
				style={{ width: 20, height: 20, marginLeft: -10, backgroundColor: NOTCH }}
			/>
			<View
				className='mx-2 flex-1'
				style={{ borderBottomWidth: 1.5, borderStyle: 'dashed', borderColor: '#E7E5E4' }}
			/>
			<View
				className='rounded-full'
				style={{ width: 20, height: 20, marginRight: -10, backgroundColor: NOTCH }}
			/>
		</View>
	);
}

// 코드로 그린 관람 완료 도장
function VisitStamp({ dateKey }: { dateKey: string }) {
	return (
		<View
			className='items-center justify-center rounded-full'
			style={{
				width: 78,
				height: 78,
				borderWidth: 2.5,
				borderColor: STAMP,
				transform: [{ rotate: '-14deg' }],
				opacity: 0.85,
			}}
		>
			<View
				className='items-center justify-center rounded-full'
				style={{ width: 66, height: 66, borderWidth: 1, borderColor: STAMP }}
			>
				<Text style={{ color: STAMP, fontFamily: 'Hahmlet_700Bold', fontSize: 13 }}>
					관람 완료
				</Text>
				<Text
					className='mt-0.5 tracking-[1px]'
					style={{ color: STAMP, fontFamily: 'Pretendard-SemiBold', fontSize: 8 }}
				>
					{dateKey.replaceAll('-', '.')}
				</Text>
			</View>
		</View>
	);
}

// 관람 기록 입장권. 탭하면 앞면(관람 정보) ↔ 뒷면(AI 일기)이 뒤집힌다.
export function VisitTicket({
	exhibition,
	listenedTitles,
	dateKey,
	dateLabel,
	diaryText,
	isStreaming = false,
	hasError = false,
	onGenerate,
}: VisitTicketProps) {
	const [flipped, setFlipped] = useState(false);
	const rotation = useSharedValue(0);

	const frontStyle = useAnimatedStyle(() => ({
		transform: [
			{ perspective: 1200 },
			{ rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` },
		],
		backfaceVisibility: 'hidden',
	}));
	const backStyle = useAnimatedStyle(() => ({
		transform: [
			{ perspective: 1200 },
			{ rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg` },
		],
		backfaceVisibility: 'hidden',
	}));

	const handleFlip = () => {
		rotation.value = withTiming(flipped ? 0 : 1, FLIP_TIMING);
		setFlipped(prev => !prev);
	};

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
			<Pressable
				onPress={handleFlip}
				accessibilityLabel={flipped ? '티켓 앞면 보기' : '티켓 뒷면 일기 보기'}
				accessibilityRole='button'
			>
				{/* 앞면: 관람 정보 */}
				<Animated.View
					className='overflow-hidden rounded-3xl bg-white'
					style={[cardShadow, frontStyle, { minHeight: TICKET_MIN_HEIGHT }]}
				>
					{/* 풀와이드 포스터: 늘어난 티켓 높이를 흡수해 이미지가 커짐 */}
					<View
						className='w-full flex-1 items-center justify-center'
						style={{ minHeight: 220 }}
					>
						{exhibition.heroImageUri || exhibition.posterImage ? (
							<Image
								source={
									exhibition.heroImageUri
										? { uri: exhibition.heroImageUri }
										: exhibition.posterImage
								}
								resizeMode='cover'
								className='h-full w-full'
							/>
						) : (
							<EmptyImagePlaceholder
								className='h-full w-full items-center justify-center bg-[#E5E1D8]'
								iconSize={100}
							/>
						)}
					</View>

					<View className='px-6 pt-5'>
						<Text
							className='text-[10px] tracking-[3px] text-[#A8A29E]'
							style={{ fontFamily: 'Pretendard-SemiBold' }}
						>
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
					<View className='mb-6 mt-5 flex-row px-6'>
						{[
							{ label: '장소', value: exhibition.venue },
							{ label: '날짜', value: dateLabel.split(' ')[0] },
							{ label: '들은 해설', value: `${listenedTitles.length}개` },
						].map(cell => (
							<View key={cell.label} className='flex-1 pr-2'>
								<Text
									className='text-[11px] text-[#A8A29E]'
									style={{ fontFamily: 'Pretendard-Medium' }}
								>
									{cell.label}
								</Text>
								<Text
									className='mt-1 text-[14px] text-[#1C1917]'
									style={{ fontFamily: 'Pretendard-SemiBold' }}
									numberOfLines={2}
								>
									{cell.value}
								</Text>
							</View>
						))}
					</View>

					<Perforation />

					{/* 하단 스텁: 바코드 + 도장 */}
					<View
						className='flex-row items-center justify-between px-6'
						style={{ height: STUB_HEIGHT }}
					>
						<View>
							<View className='flex-row items-end' accessibilityLabel='장식용 바코드'>
								{bars.map((w, i) => (
									<View
										key={i}
										style={{
											width: w,
											height: i % 4 === 0 ? 30 : 24,
											marginRight: 2,
											backgroundColor: INK,
										}}
									/>
								))}
							</View>
							<Text
								className='mt-1.5 text-[10px] tracking-[4px] text-[#78716C]'
								style={{ fontFamily: 'Pretendard-Medium' }}
							>
								{ticketNo}
							</Text>
						</View>
						<VisitStamp dateKey={dateKey} />
					</View>
				</Animated.View>

				{/* 뒷면: AI 일기 (앞면과 동일한 절취선·스텁 구조) */}
				<Animated.View
					className='overflow-hidden rounded-3xl bg-white'
					style={[cardShadow, backStyle, StyleSheet.absoluteFill]}
				>
					<View className='flex-1 px-6 pt-6'>
						<View className='flex-row items-center justify-between'>
							<Text
								className='text-[10px] tracking-[3px] text-[#A8A29E]'
								style={{ fontFamily: 'Pretendard-SemiBold' }}
							>
								DOCENT'S DIARY
							</Text>
							<Text
								className='text-[11px] text-[#A8A29E]'
								style={{ fontFamily: 'Pretendard-Medium' }}
							>
								{dateLabel}
							</Text>
						</View>

						{diaryText ? (
							<ScrollView
								className='mt-4 flex-1'
								showsVerticalScrollIndicator={false}
								nestedScrollEnabled
							>
								<Text
									className='pb-4 text-[15px] leading-[27px] text-[#44403C]'
									style={{ fontFamily: 'Pretendard-Light' }}
								>
									{diaryText}
								</Text>
							</ScrollView>
						) : (
							<View className='flex-1 items-center justify-center px-4'>
								{isStreaming ? (
									<>
										<ActivityIndicator color={INK} />
										<Text
											className='mt-3 text-[14px] text-[#A8A29E]'
											style={{ fontFamily: 'Pretendard-Regular' }}
										>
											도슨트가 일기를 쓰고 있어요...
										</Text>
									</>
								) : (
									<>
										<Text
											className='text-center text-[14px] leading-6 text-[#A8A29E]'
											style={{ fontFamily: 'Pretendard-Regular' }}
										>
											{hasError
												? '일기를 쓰다가 잉크가 번졌어요.\n다시 한번 부탁해볼까요?'
												: '티켓 뒷면이 아직 비어 있어요.\nAI 도슨트에게 일기를 부탁해보세요.'}
										</Text>
										{onGenerate && (
											<Pressable
												onPress={onGenerate}
												accessibilityLabel='AI 도슨트에게 일기 부탁하기'
												accessibilityRole='button'
												className='mt-5 rounded-full bg-[#1C1917] px-5 py-2.5'
												style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
											>
												<Text
													className='text-[14px] text-white'
													style={{ fontFamily: 'Pretendard-SemiBold' }}
												>
													{hasError ? '다시 부탁하기' : 'AI 도슨트에게 일기 부탁하기'}
												</Text>
											</Pressable>
										)}
									</>
								)}
							</View>
						)}
					</View>

					<Perforation />

					{/* 하단 스텁: 앞면과 동일 높이로 절취선 위치 고정 */}
					<View
						className='flex-row items-center justify-between px-6'
						style={{ height: STUB_HEIGHT }}
					>
						<View>
							<Text
								className='text-[10px] tracking-[3px] text-[#A8A29E]'
								style={{ fontFamily: 'Pretendard-SemiBold' }}
							>
								MUSEUM TICKET
							</Text>
							<Text
								className='mt-1 text-[10px] tracking-[3px] text-[#D6D3D1]'
								style={{ fontFamily: 'Pretendard-SemiBold' }}
							>
								ADMIT ONE
							</Text>
						</View>
						<Text
							className='text-[10px] tracking-[4px] text-[#78716C]'
							style={{ fontFamily: 'Pretendard-Medium' }}
						>
							{ticketNo}
						</Text>
					</View>
				</Animated.View>
			</Pressable>

			{/* 페이지 도트: 앞면/뒷면 표시 */}
			<View className='mt-4 flex-row items-center justify-center gap-1.5'>
				<View
					className='h-1.5 rounded-full'
					style={{
						width: flipped ? 6 : 18,
						backgroundColor: flipped ? '#bbb9b7' : '#F8F6F2',
					}}
				/>
				<View
					className='h-1.5 rounded-full'
					style={{
						width: flipped ? 18 : 6,
						backgroundColor: flipped ? '#F8F6F2' : '#bbb9b7',
					}}
				/>
			</View>

			<Text
				className='mt-2 text-center text-[12px]'
				style={{ fontFamily: 'Pretendard-Regular', color: 'rgba(255,255,255,0.4)' }}
			>
				{flipped ? '탭하면 앞면이 보여요' : '탭하면 뒷면에 일기가 있어요'}
			</Text>
		</View>
	);
}
