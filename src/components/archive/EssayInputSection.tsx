import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
	ActivityIndicator,
	type LayoutChangeEvent,
	Pressable,
	Text,
	TextInput,
	View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Chip } from '@/src/components/common/Chip';
import { TextField } from '@/src/components/common/TextField';
import { colors } from '@/src/constants/colors';
import { MAX_ESSAY_GENERATES, type EssayStage } from '@/src/hooks/useEssayStream';
import { cn } from '@/src/lib/cn';

const ESSAY_INPUT_MIN_HEIGHT = 72;
const ESSAY_LINE_HEIGHT = 22;

export type EssayInputMode = 'write' | 'generate';

export interface EssayInputSectionHandle {
	focus: () => void;
}

interface EssayInputSectionProps {
	essayText: string;
	onEssayTextChange: (text: string) => void;
	essayStage: EssayStage;
	essayInputMode: EssayInputMode;
	essayGenerateCount: number;
	onEssayGenerate: () => void;
	onEssayWriteMode: () => void;
	onEssayFocus?: () => void;
	onEssayNext: () => void;
	/** false면 하단 "다음" 버튼을 숨긴다 — 서명 단계 진입 후 */
	showNext?: boolean;
	stamped?: boolean;
}

// 확정 큐 2단계 — 한줄평/감상문 분리를 하나의 감상평 입력칸으로 합친다.
// 직접 쓰기와 생성하기를 같은 TextInput에서 처리하고, 스트리밍 값은 value로 바인딩한다.
export const EssayInputSection = forwardRef<EssayInputSectionHandle, EssayInputSectionProps>(
	function EssayInputSection(
		{
			essayText,
			onEssayTextChange,
			essayStage,
			essayInputMode,
			essayGenerateCount,
			onEssayGenerate,
			onEssayWriteMode,
			onEssayFocus,
			onEssayNext,
			showNext = true,
			stamped,
		},
		ref,
	) {
		const inputRef = useRef<TextInput>(null);
		const [inputHeight, setInputHeight] = useState(ESSAY_INPUT_MIN_HEIGHT);
		const [lineCount, setLineCount] = useState(1);

		useImperativeHandle(ref, () => ({
			focus: () => inputRef.current?.focus(),
		}));

		const isStreaming = essayStage === 'streaming';
		const isError = essayStage === 'error';
		const generateExhausted = essayGenerateCount >= MAX_ESSAY_GENERATES;
		const editable = !stamped && !isStreaming;
		const writeDisabled = !!stamped || isStreaming;
		const generateDisabled = !!stamped || isStreaming || generateExhausted;
		const nextDisabled = !!stamped || isStreaming;
		const remainingGenerates = MAX_ESSAY_GENERATES - essayGenerateCount;

		function handleWriteMode() {
			if (writeDisabled) return;
			onEssayWriteMode();
			inputRef.current?.focus();
		}

		function handleGenerate() {
			if (generateDisabled) return;
			onEssayGenerate();
		}

		function handleNext() {
			if (nextDisabled) return;
			onEssayNext();
		}

		function renderModeToggle() {
			if (stamped) return null;

			return (
				<View className="flex-row gap-1.5">
					<View
						className={cn(writeDisabled && 'opacity-40')}
						pointerEvents={writeDisabled ? 'none' : 'auto'}
					>
						<Chip
							label="직접 쓰기"
							active={essayInputMode === 'write'}
							onPress={handleWriteMode}
							accessibilityLabel="직접 쓰기"
						/>
					</View>
					<View
						className={cn(generateDisabled && 'opacity-40')}
						pointerEvents={generateDisabled ? 'none' : 'auto'}
					>
						<Chip
							label="생성하기"
							active={essayInputMode === 'generate'}
							onPress={handleGenerate}
							accessibilityLabel="생성하기"
						/>
					</View>
				</View>
			);
		}

		function renderStatus() {
			if (stamped) return null;
			if (isStreaming) return null;

			if (isError) {
				return (
					<View className="flex-row items-center gap-1.5 mt-2">
						<Ionicons name="warning-outline" size={14} color={colors.error} />
						<Text className="flex-1 text-[11px] font-pretendard-regular text-gray700">
							감상 생성에 실패했어요
						</Text>
					</View>
				);
			}

			const helperText = generateExhausted
				? '오늘은 더 생성할 수 없어요'
				: `${remainingGenerates}회 더 생성할 수 있어요`;

			return (
				<Text className="mt-2 text-[11px] font-pretendard-regular text-gray500">{helperText}</Text>
			);
		}

		function handleMeasureText(event: LayoutChangeEvent) {
			const measured = Math.ceil(event.nativeEvent.layout.height);
			const lines = Math.max(1, Math.round(measured / ESSAY_LINE_HEIGHT));
			setLineCount((prev) => (prev === lines ? prev : lines));
			const next = Math.max(ESSAY_INPUT_MIN_HEIGHT, measured);
			setInputHeight((prev) => (prev === next ? prev : next));
		}

		function renderNextButton() {
			if (stamped || !showNext) return null;

			return (
				<Pressable
					onPress={handleNext}
					disabled={nextDisabled}
					accessibilityRole="button"
					accessibilityLabel="다음"
					accessibilityState={{ disabled: nextDisabled }}
					className="rounded-2xl items-center py-3 px-6 mt-3 self-end bg-primary-dark"
					style={({ pressed }) => ({ opacity: nextDisabled ? 0.4 : pressed ? 0.9 : 1 })}
				>
					<Text className="text-white text-[14px] font-pretendard-semibold">다음</Text>
				</Pressable>
			);
		}

		return (
			<View className="border-t border-dashed border-gray300 mt-3 pt-4">
				<View className="flex-row items-center justify-between flex-wrap gap-2 mb-1.5">
					<View className="flex-row items-center gap-1.5">
						<Text className="text-[13px] text-gray600 font-pretendard-medium">감상평</Text>
						{isStreaming && <ActivityIndicator size="small" color={colors.primaryDark} />}
					</View>
					{renderModeToggle()}
				</View>
				<View
					className={cn(
						'rounded-2xl px-4 pt-3',
						lineCount >= 3 ? 'pb-5' : 'pb-3',
						isError ? 'border border-error bg-gray100' : 'border border-gray300',
						isStreaming ? 'bg-gray200' : 'bg-gray100',
					)}
				>
					{/* 스트리밍처럼 value가 프로그램으로 바뀌면 iOS TextInput은 onContentSizeChange를 안 보낸다.
					    같은 타이포의 숨은 Text로 높이를 재서 칸이 같이 커지게 한다. */}
					<Text
						pointerEvents="none"
						accessibilityElementsHidden
						importantForAccessibility="no"
						className="absolute opacity-0 w-full text-[13px] leading-[22px] font-pretendard-regular"
						onLayout={handleMeasureText}
					>
						{essayText.length > 0 ? essayText : ' '}
					</Text>
					<TextField
						ref={inputRef}
						variant="plain"
						value={essayText}
						onChangeText={onEssayTextChange}
						onFocus={onEssayFocus}
						onSubmitEditing={handleNext}
						blurOnSubmit
						returnKeyType="next"
						editable={editable}
						multiline
						scrollEnabled={false}
						placeholder="오늘 관람의 감상을 남겨보세요"
						accessibilityLabel="감상평 입력"
						accessibilityState={{ disabled: !editable }}
						className="text-[13px] leading-[22px] text-gray900"
						style={{
							minHeight: ESSAY_INPUT_MIN_HEIGHT,
							height: inputHeight,
							paddingTop: 0,
							paddingBottom: 0,
							includeFontPadding: false,
						}}
					/>
				</View>
				{renderStatus()}
				{renderNextButton()}
			</View>
		);
	},
);
