import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import type { EssayInputMode } from '@/src/components/archive/EssayInputSection';
import { ReceiptSummary, type ReceiptSummaryHandle } from '@/src/components/archive/ReceiptSummary';
import { Button } from '@/src/components/common/Button';
import { Screen } from '@/src/components/layout/Screen';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';
import { WEEKDAYS } from '@/src/constants/week';
import { MAX_ESSAY_GENERATES, useEssayStream } from '@/src/hooks/useEssayStream';
import { cn } from '@/src/lib/cn';
import { dateKeyOf, useVisitStore } from '@/src/store/visitStore';
import { formatDate } from '@/src/utils/formatDate';

/** 도장이 찍히고 다음 카드로 넘어가기 전까지 잠깐 보여주는 시간(ms) */
const STAMP_HOLD_MS = 850;

// 미확정(pending) 관람 기록을 하나씩 영수증으로 확인하고 서명해서 확정하는 큐 화면.
// 언제든 뒤로 나가도 되고, 남은 항목은 계속 미확정으로 남아 다음에 배너로 다시 안내된다.
export default function ConfirmVisitsScreen() {
	const router = useRouter();
	const { visits, confirmVisit, deleteVisit } = useVisitStore(
		useShallow((s) => ({
			visits: s.visits,
			confirmVisit: s.confirmVisit,
			deleteVisit: s.deleteVisit,
		})),
	);

	const pendingKeys = useMemo(
		() =>
			Object.keys(visits)
				.filter((k) => visits[k].status === 'pending')
				.sort(),
		[visits],
	);

	const [total] = useState(() => pendingKeys.length);
	const [hasSignature, setHasSignature] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);
	const [stamped, setStamped] = useState(false);
	// 1단계(별점) → 2단계(감상평) → 3단계(서명)
	const [rating, setRating] = useState(0);
	const [essayText, setEssayText] = useState('');
	const [essayInputMode, setEssayInputMode] = useState<EssayInputMode>('write');
	const [essayGenerateCount, setEssayGenerateCount] = useState(0);
	const [signatureStageReady, setSignatureStageReady] = useState(false);
	const [pageScrollLocked, setPageScrollLocked] = useState(false);
	const receiptRef = useRef<ReceiptSummaryHandle>(null);
	const scrollRef = useRef<ScrollView>(null);
	const {
		stage: essayStage,
		text: streamedText,
		generate: generateEssay,
		cancel: cancelEssay,
		reset: resetEssay,
		clearError: clearEssayError,
	} = useEssayStream();
	const prevEssayStageRef = useRef(essayStage);

	// 스트리밍 값을 감상평 입력칸 value로 동기화한다. 완료 후 사용자 편집은 로컬 essayText가 소유한다.
	useEffect(() => {
		if (essayStage === 'streaming' || essayStage === 'done') {
			setEssayText(streamedText);
		}
	}, [essayStage, streamedText]);

	// 성공한 생성만 횟수에 넣는다. 실패·재시도는 깎지 않는다.
	useEffect(() => {
		if (prevEssayStageRef.current !== 'done' && essayStage === 'done') {
			setEssayGenerateCount((count) => count + 1);
		}
		prevEssayStageRef.current = essayStage;
	}, [essayStage]);

	// 화면을 완전히 벗어날 때(뒤로가기 등) 진행 중이던 생성 요청을 취소하고 미완성 감상평을 폐기한다.
	useEffect(() => {
		return () => cancelEssay();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function resetCardState() {
		receiptRef.current?.clear();
		setStamped(false);
		setHasSignature(false);
		setIsConfirming(false);
		setRating(0);
		setEssayText('');
		setEssayInputMode('write');
		setEssayGenerateCount(0);
		setSignatureStageReady(false);
		setPageScrollLocked(false);
		prevEssayStageRef.current = 'idle';
		resetEssay();
	}

	const currentKey = pendingKeys[0];
	const visit = currentKey ? visits[currentKey] : undefined;
	const progressCurrent = total - pendingKeys.length + 1;
	const isLast = progressCurrent >= total;

	const dateLabel = useMemo(() => {
		if (!currentKey) return '';
		const [y, m, d] = dateKeyOf(currentKey).split('-').map(Number);
		const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
		return `${formatDate(undefined, { year: y, month: m, day: d })} ${weekday}요일`;
	}, [currentKey]);

	function finalizeConfirm(visitKey: string, signatureSvg: string | null) {
		confirmVisit(visitKey, {
			signatureSvg: signatureSvg ?? '',
			rating,
			memo: essayText.trim(),
		});

		const remaining = Object.values(useVisitStore.getState().visits).filter(
			(v) => v.status === 'pending',
		).length;

		if (remaining > 0) {
			resetCardState();
		} else {
			router.back();
		}
	}

	function handleConfirm() {
		if (!currentKey || isConfirming) return;
		setIsConfirming(true);
		const visitKey = currentKey;
		const signatureSvg = receiptRef.current?.getSvg() ?? null;

		// 서명 위에 관람 완료 도장을 쿵 찍고, 잠깐 보여준 뒤 확정 처리
		setStamped(true);
		setTimeout(() => finalizeConfirm(visitKey, signatureSvg), STAMP_HOLD_MS);
	}

	function handleSkip() {
		if (!currentKey || isConfirming) return;
		const visitKey = currentKey;
		Alert.alert(
			'이 기록을 삭제할까요?',
			'관람하지 않은 것으로 처리하고 삭제해요. 복구할 수 없어요.',
			[
				{ text: '취소', style: 'cancel' },
				{
					text: '삭제',
					style: 'destructive',
					onPress: async () => {
						await deleteVisit(visitKey);
						const remaining = Object.values(useVisitStore.getState().visits).filter(
							(v) => v.status === 'pending',
						).length;
						if (remaining > 0) {
							resetCardState();
						} else {
							router.back();
						}
					},
				},
			],
		);
	}

	function handleEssayGenerate() {
		if (!visit) return;
		if (essayStage === 'streaming') return;
		if (essayGenerateCount >= MAX_ESSAY_GENERATES) return;

		setEssayInputMode('generate');
		generateEssay({
			exhibitionTitle: visit.exhibitionTitle ?? '오늘의 전시',
			rating,
			memo: essayText.trim() || undefined,
			listenedTitles: visit.listened.map((l) => l.title),
		});
	}

	function handleEssayWriteMode() {
		setEssayInputMode('write');
		clearEssayError();
	}

	function handleEssayTextChange(text: string) {
		if (essayStage === 'streaming') return;
		setEssayText(text);
		setEssayInputMode('write');
		clearEssayError();
	}

	function handleEssayFocus() {
		scrollRef.current?.scrollToEnd({ animated: true });
		if (essayStage === 'streaming') return;
		setEssayInputMode('write');
		clearEssayError();
	}

	function handleEssayNext() {
		if (essayStage === 'streaming') return;
		Keyboard.dismiss();
		setSignatureStageReady(true);
	}

	// 서명칸이 화면 밖에 있으면 먼저 내린 뒤 페이지 스크롤을 잠근다.
	// 바로 잠그면 긴 감상평 아래 서명칸이 가려지고, 안 잠그면 그리는 동안 페이지가 밀린다.
	useEffect(() => {
		if (!signatureStageReady) {
			setPageScrollLocked(false);
			return;
		}
		const scrollTimer = setTimeout(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		}, 80);
		const lockTimer = setTimeout(() => {
			setPageScrollLocked(true);
		}, 420);
		return () => {
			clearTimeout(scrollTimer);
			clearTimeout(lockTimer);
		};
	}, [signatureStageReady]);

	function renderQueue() {
		if (!currentKey || !visit) return null;

		return (
			<>
				<View className="flex-row items-center justify-between mb-4 px-1">
					<View className="w-[70px]" />
					<Text className="flex-1 text-center font-pretendard-semibold text-[12px] text-gray500">
						{progressCurrent} / {total}
					</Text>
					<Pressable
						onPress={handleSkip}
						disabled={isConfirming}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="이 전시 관람 기록 삭제"
						className="w-[70px] items-end"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Text className="font-pretendard-regular text-[12px] text-gray500 underline">
							이 기록 삭제
						</Text>
					</Pressable>
				</View>

				<ReceiptSummary
					ref={receiptRef}
					exhibitionTitle={visit.exhibitionTitle ?? '오늘의 전시'}
					venue={visit.venue}
					dateLabel={dateLabel}
					listenedTitles={visit.listened.map((l) => l.title)}
					visitedAt={visit.visitedAt}
					rating={rating}
					onRatingChange={setRating}
					essayText={essayText}
					onEssayTextChange={handleEssayTextChange}
					essayStage={essayStage}
					essayInputMode={essayInputMode}
					essayGenerateCount={essayGenerateCount}
					onEssayGenerate={handleEssayGenerate}
					onEssayWriteMode={handleEssayWriteMode}
					onEssayFocus={handleEssayFocus}
					onEssayNext={handleEssayNext}
					signatureStageReady={signatureStageReady}
					onStrokeChange={setHasSignature}
					stamped={stamped}
				/>
			</>
		);
	}

	return (
		<Screen variant="warm">
			<ScreenHeader>
				<ScreenHeader.Back onPress={() => router.back()} />
				<ScreenHeader.Center>
					<Text className="text-[16px] font-pretendard-semibold text-gray900">확정하기</Text>
				</ScreenHeader.Center>
			</ScreenHeader>

			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				keyboardVerticalOffset={0}
			>
				<ScrollView
					ref={scrollRef}
					className="flex-1"
					contentContainerClassName={cn('px-2 pt-4', signatureStageReady ? 'pb-36' : 'pb-10')}
					keyboardShouldPersistTaps="handled"
					scrollEnabled={!pageScrollLocked}
					showsVerticalScrollIndicator={false}
				>
					{renderQueue()}
				</ScrollView>
			</KeyboardAvoidingView>
			{signatureStageReady && (
				<Screen.BottomAbsolute className="bottom-10 px-6">
					<Button
						onPress={handleConfirm}
						disabled={!hasSignature}
						loading={isConfirming}
						accessibilityLabel={isLast ? '확정하고 보관하기' : '다음 관람 보기'}
					>
						{isLast ? '확정하고 보관하기' : '다음 관람 보기'}
					</Button>
				</Screen.BottomAbsolute>
			)}
		</Screen>
	);
}
