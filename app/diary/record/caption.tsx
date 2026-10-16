import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/src/components/common/Button';
import { Screen } from '@/src/components/layout/Screen';
import { RecordFramePreview } from '@/src/components/record/RecordFramePreview';
import { RecordStepHeader } from '@/src/components/record/RecordStepHeader';
import { RecordWriteProgress } from '@/src/components/record/RecordWriteProgress';
import { colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/store/authStore';
import { useRecordDraftStore } from '@/src/store/recordDraftStore';
import { makeVisitKey, useVisitStore, visitIdentityOf } from '@/src/store/visitStore';
import { getProgressTotal } from '@/src/utils/recordWriteFlow';
import { uploadVisitRecordPhotos } from '@/src/utils/visitPhotos';
import { getRecordDateKey, toPassDate } from '@/src/utils/visitRecord';
import { cn } from '@/src/lib/cn';

/** 액자가 벽에 걸리는 동안 보여준 뒤 다이어리로 돌아간다 */
const HANG_HOLD_MS = 900;
/** 화면이 닫히는 전환이 끝나기를 기다리는 시간 */
const DISMISS_SETTLE_MS = 600;

/** 기록하기 3단계(마지막) — 확인: 어떻게 저장될지 보여주고, 고칠 곳은 뒤로 돌아가 수정한다. 남기면 벽에 걸린다 */
export default function RecordCaptionScreen() {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);
	const [isHung, setIsHung] = useState(false);
	const scrollRef = useRef<ScrollView>(null);
	const { draft, reset } = useRecordDraftStore(
		useShallow((s) => ({ draft: s.draft, reset: s.reset })),
	);
	const saveRecord = useVisitStore((s) => s.saveRecord);
	const userId = useAuthStore((s) => s.user?.id);

	// 앞 단계를 거치지 않고 들어온 경우(앱 재시작 등) 처음으로 돌려보낸다
	// 저장 뒤에는 draft를 일부러 비우므로 제외한다 — 아니면 나가는 도중 새 기록 화면으로 되돌아간다
	useEffect(() => {
		if (isHung) return;
		if (!draft || !draft.rating) router.replace('/diary/record');
	}, [draft, isHung, router]);

	if (!draft || !draft.rating) return null;

	const rating = draft.rating;
	const photos = draft.photos ?? [];
	const memo = draft.memo ?? '';
	const dateKey = getRecordDateKey(draft);
	const isBusy = isSaving || isHung;
	const totalSteps = getProgressTotal(draft.fromPicker === true, Boolean(draft.fixedDateKey));

	const listenedTitles = draft.listenedTitles ?? [];

	const summaryRows = [
		{ label: '방문일', value: toPassDate(dateKey) },
		{ label: '별점', value: `${rating.toFixed(1)} / 5` },
		{ label: '사진', value: photos.length > 0 ? `${photos.length}장` : '없음' },
		{ label: '재방문', value: draft.isRevisit ? '또 갈 거예요' : '다시 안 갈 거예요' },
		{ label: '캡션', value: memo.trim() || '없음' },
	];

	const handleBack = () => {
		if (!isBusy) router.back();
	};

	const handleSave = async () => {
		if (isBusy) return;
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
			router.dismissAll();
			// 화면이 빠지는 동안 아래 화면이 빈 draft로 다시 그려지지 않게 닫힌 뒤에 비운다
			setTimeout(reset, DISMISS_SETTLE_MS);
		}, HANG_HOLD_MS);
	};

	return (
		<Screen variant="warm">
			<RecordStepHeader
				step={draft.fromPicker ? 3 : 2}
				total={draft.fromPicker ? 3 : 2}
				onBack={handleBack}
			/>
			<RecordWriteProgress index={totalSteps - 1} total={totalSteps} />

			<ScrollView
				ref={scrollRef}
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerClassName="pb-6 pt-2"
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

				<View className="rounded-2xl px-4">
					{summaryRows.map((row, index) => (
						<View
							key={row.label}
							className={cn(
								'flex-row gap-4 border-t-[0.5px] border-divider py-3.5',
								index !== summaryRows.length - 1 ? 'items-center' : 'items-start',
							)}
						>
							<Text
								className={cn(
									index === summaryRows.length - 1 ? 'pt-0.5' : '',
									'w-14 font-pretendard-medium text-[13px] text-gray600',
								)}
							>
								{row.label}
							</Text>
							<Text className="flex-1 font-pretendard-regular text-[14px] leading-[20px] text-gray900">
								{row.value}
							</Text>
						</View>
					))}

					{listenedTitles.length > 0 && (
						<View className="border-t-[0.5px] border-divider py-3.5">
							<View className="flex-row items-center gap-1.5">
								<Ionicons name="musical-notes-outline" size={15} color={colors.gray600} />
								<Text
									accessibilityRole="header"
									className="font-pretendard-medium text-[13px] text-gray600"
								>
									{`플레이리스트 ${listenedTitles.length}`}
								</Text>
							</View>
							{listenedTitles.map((title, index) => (
								<View key={`${title}-${index}`} className="mt-2.5 flex-row items-start gap-3">
									<Text className="w-5 font-pretendard-medium text-[13px] leading-[20px] text-gray500">
										{index + 1}
									</Text>
									<Text className="flex-1 font-pretendard-regular text-[14px] leading-[20px] text-gray900">
										{title}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>
			</ScrollView>

			<Screen.Bottom className="bg-bg-light pb-10">
				<View className="flex-row items-center gap-2">
					<Button
						variant="ghost"
						tone="gray"
						onPress={handleBack}
						disabled={isBusy}
						accessibilityLabel="이전 질문으로 돌아가 수정"
						className="px-5"
					>
						뒤로
					</Button>
					<Button
						onPress={handleSave}
						disabled={isBusy}
						loading={isSaving && !isHung}
						accessibilityLabel="기록 남기기"
						tone="inverse"
						haptic="medium"
						block={false}
						className="flex-1"
					>
						기록 남기기
					</Button>
				</View>
			</Screen.Bottom>
		</Screen>
	);
}
