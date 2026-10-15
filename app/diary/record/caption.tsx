import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/src/components/common/Button';
import { TextField } from '@/src/components/common/TextField';
import { Screen } from '@/src/components/layout/Screen';
import { RecordFormSection } from '@/src/components/record/RecordFormSection';
import { RecordFramePreview } from '@/src/components/record/RecordFramePreview';
import { RecordStepHeader } from '@/src/components/record/RecordStepHeader';
import { useEssayStream } from '@/src/hooks/useEssayStream';
import { useAuthStore } from '@/src/store/authStore';
import { useRecordDraftStore } from '@/src/store/recordDraftStore';
import { makeVisitKey, useVisitStore, visitIdentityOf } from '@/src/store/visitStore';
import { uploadVisitRecordPhotos } from '@/src/utils/visitPhotos';
import { getRecordDateKey } from '@/src/utils/visitRecord';

const MAX_MEMO_LENGTH = 100;
/** 액자가 벽에 걸리는 동안 보여준 뒤 다이어리로 돌아간다 */
const HANG_HOLD_MS = 900;

/** 기록하기 3단계 — 캡션: 한 줄을 적으면 위의 액자 캡션이 함께 채워지고, 남기면 벽에 걸린다 */
export default function RecordCaptionScreen() {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);
	const [isHung, setIsHung] = useState(false);
	const scrollRef = useRef<ScrollView>(null);
	const { draft, patch, reset } = useRecordDraftStore(
		useShallow((s) => ({ draft: s.draft, patch: s.patch, reset: s.reset })),
	);
	const saveRecord = useVisitStore((s) => s.saveRecord);
	const userId = useAuthStore((s) => s.user?.id);
	const { stage: essayStage, text: essayText, generate, cancel } = useEssayStream();

	// AI가 다듬는 동안 입력칸을 스트리밍 글로 채운다
	useEffect(() => {
		if (essayStage === 'streaming' || essayStage === 'done') {
			patch({ memo: essayText.slice(0, MAX_MEMO_LENGTH) });
		}
	}, [essayStage, essayText, patch]);

	// 화면을 나가면 진행 중인 생성을 멈춘다
	useEffect(() => () => cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps

	// 앞 단계를 거치지 않고 들어온 경우(앱 재시작 등) 처음으로 돌려보낸다
	useEffect(() => {
		if (!draft || !draft.rating) router.replace('/diary/record');
	}, [draft, router]);

	if (!draft || !draft.rating) return null;

	const rating = draft.rating;
	const photos = draft.photos ?? [];
	const memo = draft.memo ?? '';
	const dateKey = getRecordDateKey(draft);

	const isStreaming = essayStage === 'streaming';
	const hasMemo = memo.trim().length > 0;
	// AI는 직접 쓴 한 줄을 다듬기만 한다 — 빈 칸에서 지어내지 않게
	const canRefine = hasMemo && !isStreaming;
	const canSave = !isSaving && !isStreaming && !isHung;

	const handleRefine = () => {
		if (!canRefine) return;
		generate({
			exhibitionTitle: draft.title,
			rating,
			memo: memo.trim(),
			listenedTitles: draft.listenedTitles ?? [],
		});
	};

	const handleSave = async () => {
		if (!canSave) return;
		setIsSaving(true);

		// 직접 기록에서 올린 포스터만 업로드 — 검색한 전시 포스터는 이미 원격 이미지다
		const uploadedPoster = draft.isPosterUploaded ? (draft.poster ?? undefined) : undefined;
		let poster = uploadedPoster;
		let photoUris = photos;

		if (userId) {
			try {
				const identity = visitIdentityOf(makeVisitKey(dateKey, draft.exhibitionId, draft.title));
				const uploaded = await uploadVisitRecordPhotos(userId, dateKey, identity, {
					poster: uploadedPoster,
					photos,
				});
				poster = uploaded.posterUrl;
				photoUris = uploaded.photoUrls;
			} catch (error) {
				console.warn('[record] photo upload failed:', error);
				Alert.alert('저장 실패', '사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.');
				setIsSaving(false);
				return;
			}
		}

		saveRecord({
			dateKey,
			exhibitionId: draft.exhibitionId,
			title: draft.title,
			venue: draft.venue,
			poster,
			photos: photoUris,
			rating,
			memo: memo.trim(),
			isRevisit: draft.isRevisit ?? false,
		});

		// 걸리는 액자가 보이도록 맨 위로 올린다
		scrollRef.current?.scrollTo({ y: 0, animated: true });
		setIsHung(true);
		setTimeout(() => {
			reset();
			router.dismissAll();
		}, HANG_HOLD_MS);
	};

	return (
		<Screen variant="warm">
			<RecordStepHeader step={3} />

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					ref={scrollRef}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerClassName="pb-44 pt-2"
				>
					<RecordFramePreview
						hung={isHung}
						dateKey={dateKey}
						exhibitionId={draft.exhibitionId}
						title={draft.title}
						venue={draft.venue}
						imageUri={draft.poster ?? photos[0]}
						memo={memo}
						rating={rating}
					/>

					<RecordFormSection
						label="캡션을 달아요"
						hint={`${memo.length}/${MAX_MEMO_LENGTH}`}
						action={
							<Pressable
								onPress={handleRefine}
								disabled={!canRefine}
								hitSlop={8}
								accessibilityRole="button"
								accessibilityLabel="AI로 한 줄 다듬기"
								accessibilityHint="쓴 글을 바탕으로 문장을 다듬어요"
								accessibilityState={{ disabled: !canRefine }}
								className="flex-row items-center gap-1"
								style={({ pressed }) => ({ opacity: canRefine ? (pressed ? 0.6 : 1) : 0.4 })}
							>
								<Ionicons name="sparkles-outline" size={14} className="text-brand" />
								<Text className="font-pretendard-semibold text-[13px] text-brand">
									{isStreaming ? '다듬는 중…' : 'AI로 다듬기'}
								</Text>
							</Pressable>
						}
					>
						<TextField
							variant="area"
							value={memo}
							onChangeText={(text) => patch({ memo: text.slice(0, MAX_MEMO_LENGTH) })}
							onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
							editable={!isStreaming}
							placeholder="오래 기억하고 싶은 한 줄을 남겨요"
							maxLength={MAX_MEMO_LENGTH}
						/>
						{!hasMemo && (
							<Text className="mt-2 font-pretendard-regular text-[12px] text-gray500">
								비워 두어도 괜찮아요
							</Text>
						)}
					</RecordFormSection>
				</ScrollView>

				<Screen.BottomAbsolute className="bottom-0 bg-bg-light px-6 pb-10 pt-3">
					<Button
						onPress={handleSave}
						disabled={!canSave}
						loading={isSaving && !isHung}
						accessibilityLabel="기록 남기기"
						tone="inverse"
						haptic="medium"
					>
						기록 남기기
					</Button>
				</Screen.BottomAbsolute>
			</KeyboardAvoidingView>
		</Screen>
	);
}
