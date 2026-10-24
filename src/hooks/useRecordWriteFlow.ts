import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useRecordDraftStore } from '@/src/store/recordDraftStore';
import {
	canAdvanceWriteStep,
	getNextWriteStep,
	getPrevWriteStep,
	getProgressTotal,
	getWriteStepIndex,
	getWriteSteps,
	PICK_STEP,
	resolveWriteStep,
	type FlowStep,
} from '@/src/utils/recordWriteFlow';
import { getRecordDateKey } from '@/src/utils/visitRecord';

/** 이전 단계로 이동한다 — 이동했으면 true, 화면을 나가야 하면 false */
const goToPrevStep = (): boolean => {
	const { draft, patch } = useRecordDraftStore.getState();
	if (!draft || draft.writeStep === PICK_STEP) return false;

	const prev = getPrevWriteStep(draft.writeStep, getWriteSteps(Boolean(draft.fixedDateKey)));
	if (prev) {
		patch({ writeStep: prev });
		return true;
	}
	// 전시 고르기를 이 화면에서 거쳐 왔다면 첫 질문에서 고르기로 돌아간다
	if (draft.fromPicker) {
		patch({ writeStep: PICK_STEP });
		return true;
	}
	return false;
};

/** 기록하기의 단계 이동(전시 고르기 + 질문들) — 현재 단계는 draft에 두어 캡션에서 돌아와도 같은 자리로 복원된다 */
export const useRecordWriteFlow = () => {
	const router = useRouter();
	const { draft, patch } = useRecordDraftStore(
		useShallow((s) => ({ draft: s.draft, patch: s.patch })),
	);

	// 아직 전시를 고르지 않았거나(draft 없음) 고르기로 돌아온 경우
	const isPicking = !draft || draft.writeStep === PICK_STEP;
	// 방문일이 정해져 있으면(도슨트 관람) 방문일 질문 없이 별점부터 시작한다
	const hasFixedDate = Boolean(draft?.fixedDateKey);
	const steps = getWriteSteps(hasFixedDate);
	const step: FlowStep = isPicking ? PICK_STEP : resolveWriteStep(draft.writeStep, steps);
	// 고르기를 이 화면에서 거치는 흐름이면 질문 번호가 한 칸 밀린다 (diary.tsx처럼 바로 들어오면 질문만 센다)
	const pickOffset = !draft || draft.fromPicker ? 1 : 0;
	const canAdvance =
		step !== PICK_STEP &&
		canAdvanceWriteStep(step, {
			rating: draft?.rating,
			isRevisit: draft?.isRevisit,
		});

	const goBack = () => {
		if (goToPrevStep()) return;
		router.back();
	};

	const goNext = () => {
		if (!draft || !canAdvance) return;
		const next = getNextWriteStep(step, steps);
		if (next) {
			patch({ writeStep: next });
			return;
		}
		// 방문일을 고르지 않았어도 기본값을 확정해 캡션 단계와 저장이 같은 날짜를 쓰게 한다
		patch({ dateKey: getRecordDateKey(draft), writeStep: step });
		router.push('/diary/record/caption');
	};

	// Android 하드웨어 뒤로가기는 이전 단계로 — 맨 앞 단계에서는 기본 동작(화면 나가기)에 맡긴다
	useEffect(() => {
		if (Platform.OS !== 'android') return;
		const subscription = BackHandler.addEventListener('hardwareBackPress', goToPrevStep);
		return () => subscription.remove();
	}, []);

	return {
		step,
		stepIndex: step === PICK_STEP ? 0 : getWriteStepIndex(step, steps) + pickOffset,
		totalSteps: getProgressTotal(pickOffset === 1, hasFixedDate),
		canAdvance,
		goBack,
		goNext,
	};
};
