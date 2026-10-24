import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { StarRating } from '@/src/components/archive/StarRating';
import { Button } from '@/src/components/common/Button';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { Screen } from '@/src/components/layout/Screen';
import { PhotoGrid } from '@/src/components/record/PhotoGrid';
import { RecordChoice } from '@/src/components/record/RecordChoice';
import { RecordExhibitionPicker } from '@/src/components/record/RecordExhibitionPicker';
import { RecordMemoField } from '@/src/components/record/RecordMemoField';
import { RecordQuestion } from '@/src/components/record/RecordQuestion';
import { RecordStepHeader } from '@/src/components/record/RecordStepHeader';
import { RecordWriteProgress } from '@/src/components/record/RecordWriteProgress';
import { useRecordWriteFlow } from '@/src/hooks/useRecordWriteFlow';
import { cn } from '@/src/lib/cn';
import { useRecordDraftStore, type RecordDraft } from '@/src/store/recordDraftStore';
import { dateKeyFrom } from '@/src/store/visitStore';
import { isValidExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { parseDate } from '@/src/utils/mapUtils';
import { PICK_STEP } from '@/src/utils/recordWriteFlow';
import { getRecordDateKey, MAX_RECORD_PHOTOS, toPassDate } from '@/src/utils/visitRecord';

const MAX_MEMO_LENGTH = 100;

/** 기록하기 — 전시 고르기 → 방문일 → 별점 → 오늘 찍은 사진 → 재방문, 화면 이동 없이 한 번에 한 질문씩 */
export default function RecordWriteScreen() {
	const reduceMotion = useReducedMotion();
	const [isPickingDate, setIsPickingDate] = useState(false);
	const scrollRef = useRef<ScrollView>(null);
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
	useEffect(() => {
		const showSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			() => setIsKeyboardVisible(true),
		);
		const hideSub = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => setIsKeyboardVisible(false),
		);
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const { draft, patch, start } = useRecordDraftStore(
		useShallow((s) => ({ draft: s.draft, patch: s.patch, start: s.start })),
	);
	const { step, stepIndex, totalSteps, canAdvance, goBack, goNext } = useRecordWriteFlow();

	// 전시를 새로 골랐으니 이전 작성 내용은 버리고 방문일 질문부터 시작한다
	const handlePickExhibition = (picked: RecordDraft) =>
		start({ ...picked, fromPicker: true, writeStep: 'date' });

	if (step === PICK_STEP) {
		return (
			<Screen variant="warm">
				{/* 헤더·진행 바는 질문 화면과 같은 위치·타입으로 둬야 단계가 바뀔 때 진행 바가 이어서 움직인다 */}
				<Stack.Screen options={{ gestureEnabled: true }} />
				<RecordStepHeader step={1} onBack={goBack} />
				<RecordWriteProgress index={stepIndex} total={totalSteps} />
				<Animated.View
					key={step}
					className="flex-1"
					entering={reduceMotion ? undefined : FadeIn.duration(180)}
				>
					<RecordExhibitionPicker onPick={handlePickExhibition} />
				</Animated.View>
			</Screen>
		);
	}

	if (!draft) return null;

	const today = new Date();
	const dateKey = getRecordDateKey(draft, today);
	const isDateFixed = Boolean(draft.fixedDateKey);
	const minDate = isValidExhibitionDateString(draft.startDate)
		? parseDate(draft.startDate as string)
		: undefined;
	const endDate = isValidExhibitionDateString(draft.endDate)
		? parseDate(draft.endDate as string)
		: undefined;
	const maxDate = endDate && endDate < today ? endDate : today;
	const rating = draft.rating ?? 0;
	const photos = draft.photos ?? [];
	// 사진은 선택이라 한 장도 없으면 "건너뛰기"로 보여준다
	const nextLabel = step === 'photos' && photos.length === 0 ? '건너뛰기' : '다음';

	return (
		<Screen variant="warm">
			{/* 질문 사이에서 스와이프 백으로 화면째 빠지지 않게 한다 — 맨 앞 단계에서만 허용 */}
			<Stack.Screen options={{ gestureEnabled: stepIndex === 0 }} />
			<RecordStepHeader
				step={draft.fromPicker ? 2 : 1}
				total={draft.fromPicker ? 3 : 2}
				onBack={goBack}
			/>
			<RecordWriteProgress index={stepIndex} total={totalSteps} />

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					ref={scrollRef}
					className="flex-1"
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerClassName="pb-6"
				>
					{/*
					<View className="mt-3">
						<RecordFramePreview
							compact
							dateKey={dateKey}
							exhibitionId={draft.exhibitionId}
							title={draft.title}
							venue={draft.venue}
							imageUri={draft.poster ?? photos[0]}
							rating={rating > 0 ? rating : undefined}
						/>
					</View> */}

					<Animated.View key={step} entering={reduceMotion ? undefined : FadeIn.duration(180)}>
						{step === 'date' && (
							<RecordQuestion title="언제 방문했나요?" description="실제 방문한 날짜를 알려주세요">
								<Pressable
									onPress={() => setIsPickingDate(true)}
									disabled={isDateFixed}
									accessibilityRole="button"
									accessibilityLabel={
										isDateFixed
											? `방문일 ${toPassDate(dateKey)}, 도슨트 관람일로 고정`
											: `방문일 ${toPassDate(dateKey)}, 바꾸기`
									}
									accessibilityState={{ disabled: isDateFixed }}
									className="min-h-[56px] flex-row items-end justify-between border-b border-divider/50 pb-3"
									style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								>
									<Text className="font-pretendard-medium text-lg leading-[34px] text-ink">
										{toPassDate(dateKey)}
									</Text>
									<Ionicons
										name={isDateFixed ? 'lock-closed-outline' : 'calendar-outline'}
										size={18}
										className="mb-2 text-gray600"
									/>
								</Pressable>
								{isDateFixed && (
									<Text className="mt-2 font-pretendard-regular text-[12px] text-gray600">
										도슨트 관람일로 고정
									</Text>
								)}
							</RecordQuestion>
						)}

						{step === 'rating' && (
							<RecordQuestion
								title="전시는 어땠나요?"
								description="만족도에 따라 별점과 후기를 남겨주세요"
							>
								<View className="mt-6 items-center rounded-3xl bg-white py-7">
									<StarRating
										value={rating}
										onChange={(value) => patch({ rating: value })}
										size={28}
										tone="gold"
									/>
									<Text
										className={cn('mt-4 font-pretendard-medium', {
											'text-[18px] text-ink': rating > 0,
											'text-[14px] text-gray600': rating === 0,
										})}
									>
										{rating > 0 ? `${rating.toFixed(1)} / 5` : '별을 탭해 점수를 남겨보세요'}
									</Text>
								</View>
								{rating > 0 && (
									<Animated.View
										className="mt-6"
										entering={reduceMotion ? undefined : FadeInDown.duration(260)}
										exiting={reduceMotion ? undefined : FadeOutUp.duration(150)}
									>
										<RecordMemoField
											value={draft.memo ?? ''}
											onChange={(memo) => patch({ memo })}
											exhibitionTitle={draft.title}
											rating={rating}
											listenedTitles={draft.listenedTitles ?? []}
											maxLength={MAX_MEMO_LENGTH}
										/>
									</Animated.View>
								)}
							</RecordQuestion>
						)}

						{step === 'photos' && (
							<RecordQuestion
								title="오늘 찍은 사진이 있나요?"
								description="선택이에요. 최대 6장까지 올릴 수 있어요"
							>
								<PhotoGrid
									value={photos}
									onChange={(value) => patch({ photos: value })}
									max={MAX_RECORD_PHOTOS}
								/>
							</RecordQuestion>
						)}

						{step === 'revisit' && (
							<RecordQuestion title="다시 방문할 의향있나요?">
								<View accessibilityRole="radiogroup" className="gap-3">
									<RecordChoice
										label="네, 또 갈거에요."
										selected={draft.isRevisit === true}
										onPress={() => patch({ isRevisit: true })}
									/>
									{/* <RecordChoice
										label="고민중이에요."
										selected={draft.isRevisit === true}
										onPress={() => patch({ isRevisit: true })}
									/> */}
									<RecordChoice
										label="아니요, 다시 안 갈거에요."
										selected={draft.isRevisit === false}
										onPress={() => patch({ isRevisit: false })}
									/>
								</View>
							</RecordQuestion>
						)}
					</Animated.View>
				</ScrollView>

				<Screen.Bottom className={cn('bg-bg-light', isKeyboardVisible ? 'pb-3' : 'pb-10')}>
					<View className="flex-row items-center gap-2">
						<Button
							variant="ghost"
							tone="gray"
							onPress={goBack}
							accessibilityLabel="이전 질문"
							className="px-5"
						>
							뒤로
						</Button>
						<Button
							onPress={goNext}
							disabled={!canAdvance}
							accessibilityLabel={nextLabel}
							tone="inverse"
							haptic="light"
							block={false}
							className="flex-1"
						>
							{nextLabel}
						</Button>
					</View>
				</Screen.Bottom>
			</KeyboardAvoidingView>

			<DatePickerModal
				visible={isPickingDate}
				value={parseDate(dateKey.replaceAll('-', '.'))}
				minimumDate={minDate}
				maximumDate={maxDate}
				onChange={(date) => patch({ dateKey: dateKeyFrom(date) })}
				onDismiss={() => setIsPickingDate(false)}
			/>
		</Screen>
	);
}
