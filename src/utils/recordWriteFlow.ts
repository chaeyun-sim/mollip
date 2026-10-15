/**
 * 기록하기 2단계(감상)의 질문 순서 — 한 번에 한 질문씩 보여준다.
 * 질문을 더하거나 바꿀 때는 이 배열만 고치면 진행 바·카운터·이동이 따라온다.
 */
export const WRITE_STEPS = ['date', 'rating', 'photos', 'revisit'] as const;

export type WriteStep = (typeof WRITE_STEPS)[number];

/** 전시 고르기 — 질문 앞에 붙는 첫 단계. 질문 배열(WRITE_STEPS)과 분리해 질문 로직·테스트를 그대로 둔다 */
export const PICK_STEP = 'pick';

export type FlowStep = typeof PICK_STEP | WriteStep;

/** 질문별 답변 중 다음으로 넘어가는 조건에 쓰이는 값 */
export interface WriteAnswers {
	rating?: number;
	isRevisit?: boolean;
}

/** 저장된 단계가 없거나 알 수 없는 값이면 첫 질문으로 돌린다 */
export const resolveWriteStep = (step?: string): WriteStep =>
	WRITE_STEPS.find((candidate) => candidate === step) ?? WRITE_STEPS[0];

export const getWriteStepIndex = (step?: string): number =>
	WRITE_STEPS.indexOf(resolveWriteStep(step));

/** 다음 질문 — 마지막이면 null (다음 화면으로 넘어간다) */
export const getNextWriteStep = (step?: string): WriteStep | null =>
	WRITE_STEPS[getWriteStepIndex(step) + 1] ?? null;

/** 이전 질문 — 첫 질문이면 null (기록하기 1단계로 나간다) */
export const getPrevWriteStep = (step?: string): WriteStep | null =>
	WRITE_STEPS[getWriteStepIndex(step) - 1] ?? null;

/** 별점은 필수, 재방문은 "예/아니요"를 직접 골라야 한다. 방문일·사진은 항상 넘어갈 수 있다 */
export const canAdvanceWriteStep = (step: string | undefined, answers: WriteAnswers): boolean => {
	switch (resolveWriteStep(step)) {
		case 'rating':
			return (answers.rating ?? 0) > 0;
		case 'revisit':
			return answers.isRevisit !== undefined;
		default:
			return true;
	}
};
