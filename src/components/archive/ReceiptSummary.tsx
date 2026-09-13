import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import {
	EssayInputSection,
	type EssayInputMode,
	type EssayInputSectionHandle,
} from '@/src/components/archive/EssayInputSection';
import { Perforation } from '@/src/components/archive/VisitTicketFooter';
import { SignaturePad, type SignaturePadHandle } from '@/src/components/archive/SignaturePad';
import { StarRating } from '@/src/components/archive/StarRating';
import { VisitStamp } from '@/src/components/archive/VisitStamp';
import type { EssayStage } from '@/src/hooks/useEssayStream';
import { formatClockTime } from '@/src/utils/formatDate';

const MAX_VISIBLE_TITLES = 6;
const SIGNATURE_WIDTH = 250;
const SIGNATURE_HEIGHT = 100;

export interface ReceiptSummaryHandle {
	getSvg: () => string | null;
	clear: () => void;
}

interface ReceiptSummaryProps {
	exhibitionTitle: string;
	venue?: string;
	dateLabel: string;
	listenedTitles: string[];
	visitedAt?: { start: string; end: string };
	/** 1단계 — 별점(필수) */
	rating: number;
	onRatingChange: (value: number) => void;
	/** 2단계 — 감상평(직접 쓰기/생성하기) */
	essayText: string;
	onEssayTextChange: (text: string) => void;
	essayStage: EssayStage;
	essayInputMode: EssayInputMode;
	essayGenerateCount: number;
	onEssayGenerate: () => void;
	onEssayWriteMode: () => void;
	onEssayFocus?: () => void;
	onEssayNext: () => void;
	/** 3단계(서명) 도달 여부 — true면 서명 패드가 나타난다 */
	signatureStageReady: boolean;
	/** 서명 스트로크 유무 — 부모가 "확정하고 보관하기" 버튼을 활성화할지 판단하는 데 쓴다 */
	onStrokeChange?: (hasStrokes: boolean) => void;
	/** true가 되면 서명 위에 관람 완료 도장이 쿵 찍힌다 */
	stamped?: boolean;
}

// 확정 큐(confirm-visits)에서 보여주는 영수증 스타일 요약 카드
// 재생목록/장소/관람 시간 → 별점(필수) → 감상평(선택) → 서명, 순서대로 펼쳐진다
export const ReceiptSummary = forwardRef<ReceiptSummaryHandle, ReceiptSummaryProps>(
	function ReceiptSummary(
		{
			exhibitionTitle,
			venue,
			dateLabel,
			listenedTitles,
			visitedAt,
			rating,
			onRatingChange,
			essayText,
			onEssayTextChange,
			essayStage,
			essayInputMode,
			essayGenerateCount,
			onEssayGenerate,
			onEssayWriteMode,
			onEssayFocus,
			onEssayNext,
			signatureStageReady,
			onStrokeChange,
			stamped,
		},
		ref,
	) {
		const signaturePadRef = useRef<SignaturePadHandle>(null);
		const essayInputRef = useRef<EssayInputSectionHandle>(null);
		const hasFocusedEssayRef = useRef(false);
		const [hasStrokes, setHasStrokes] = useState(false);
		const stampScale = useSharedValue(0.4);
		const stampOpacity = useSharedValue(0);

		useImperativeHandle(ref, () => ({
			getSvg: () => signaturePadRef.current?.getSvg() ?? null,
			clear: () => signaturePadRef.current?.clear(),
		}));

		function handleStrokeChange(next: boolean) {
			setHasStrokes(next);
			onStrokeChange?.(next);
		}

		function handleClearSignature() {
			signaturePadRef.current?.clear();
		}

		// 별점을 처음 매기는 순간에만 감상평 입력칸에 자동 포커스 — 이후 별점을 바꿔도 다시 포커스하지 않는다
		useEffect(() => {
			if (rating > 0 && !hasFocusedEssayRef.current && !stamped) {
				hasFocusedEssayRef.current = true;
				const timer = setTimeout(() => essayInputRef.current?.focus(), 150);
				return () => clearTimeout(timer);
			}
		}, [rating, stamped]);

		useEffect(() => {
			if (stamped) {
				stampOpacity.set(withTiming(1, { duration: 120 }));
				stampScale.set(withTiming(1, { duration: 260, easing: Easing.out(Easing.back(1.8)) }));
			} else {
				stampOpacity.set(0);
				stampScale.set(0.4);
			}
		}, [stamped, stampOpacity, stampScale]);

		const stampStyle = useAnimatedStyle(() => ({
			opacity: stampOpacity.value,
			transform: [{ scale: stampScale.value }],
		}));

		return (
			<View
				className="rounded-3xl bg-white overflow-hidden"
				style={{
					shadowColor: '#000000',
					shadowOpacity: 0.15,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: 4 },
				}}
			>
				<View className="px-6 pt-6 pb-4">
					<Text className="mt-1.5 text-[21px] leading-[28px] text-gray900 font-hahmlet-bold">
						{exhibitionTitle}
					</Text>
					<Text className="mt-1 text-[12px] text-gray600 font-pretendard-medium">{dateLabel}</Text>
				</View>

				<Perforation notchColor="#F8F6F2" />

				<View className="px-6 pt-4 pb-6">
					<Text className="text-[15px] font-pretendard-semibold text-gray900 mb-2">
						오늘의 프로그램
					</Text>
					{listenedTitles.length > 0 ? (
						<>
							{listenedTitles.slice(0, MAX_VISIBLE_TITLES).map((title, i) => (
								<View
									key={`${title}-${i}`}
									className="flex-row items-baseline justify-between mb-1.5"
								>
									<Text
										className="flex-1 text-[13px] font-pretendard-regular text-gray700"
										numberOfLines={1}
									>
										{title}
									</Text>
								</View>
							))}
							{listenedTitles.length > MAX_VISIBLE_TITLES && (
								<Text className="text-[13px] font-pretendard-regular text-gray500">
									…외 {listenedTitles.length - MAX_VISIBLE_TITLES}개
								</Text>
							)}
						</>
					) : (
						<Text className="text-[13px] font-pretendard-regular text-gray500">
							들은 해설이 없어요
						</Text>
					)}

					<View className="border-t border-dashed border-gray300 mt-3 pt-3">
						<View className="flex-row justify-between">
							<Text className="text-[13px] text-gray500 font-pretendard-medium">장소</Text>
							<Text className="text-[13px] text-gray900 font-pretendard-medium">
								{venue ?? '-'}
							</Text>
						</View>
						{visitedAt && (
							<View className="flex-row justify-between mt-3">
								<Text className="text-[13px] text-gray500 font-pretendard-medium">관람 시간</Text>
								<Text className="text-[13px] text-gray900 font-pretendard-medium">
									{formatClockTime(visitedAt.start)} – {formatClockTime(visitedAt.end)}
								</Text>
							</View>
						)}
					</View>

					<View className="border-t border-dashed border-gray300 mt-3 pt-4 items-center">
						<Text className="text-[13px] text-gray600 font-pretendard-medium mb-3">
							오늘 관람, 어떠셨나요?
						</Text>
						<StarRating value={rating} onChange={onRatingChange} disabled={stamped || rating > 0} />
					</View>

					{rating > 0 && (
						<EssayInputSection
							ref={essayInputRef}
							essayText={essayText}
							onEssayTextChange={onEssayTextChange}
							essayStage={essayStage}
							essayInputMode={essayInputMode}
							essayGenerateCount={essayGenerateCount}
							onEssayGenerate={onEssayGenerate}
							onEssayWriteMode={onEssayWriteMode}
							onEssayFocus={onEssayFocus}
							onEssayNext={onEssayNext}
							showNext={!signatureStageReady}
							stamped={stamped}
						/>
					)}

					{signatureStageReady && (
						<View className="items-center mt-8">
							<SignaturePad
								ref={signaturePadRef}
								width={SIGNATURE_WIDTH}
								height={SIGNATURE_HEIGHT}
								onStrokeChange={handleStrokeChange}
								disabled={stamped}
							/>
							{stamped && (
								<Animated.View
									style={[{ position: 'absolute', bottom: -15, right: 0 }, stampStyle]}
									pointerEvents="none"
								>
									<VisitStamp />
								</Animated.View>
							)}
							{hasStrokes && !stamped && (
								<Pressable
									onPress={handleClearSignature}
									hitSlop={8}
									accessibilityRole="button"
									accessibilityLabel="서명 지우기"
									className="mt-2"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Text className="text-[12px] font-pretendard-regular text-gray500 underline">
										서명 지우기
									</Text>
								</Pressable>
							)}
						</View>
					)}
				</View>
			</View>
		);
	},
);
