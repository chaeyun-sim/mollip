import {
	canAdvanceWriteStep,
	getNextWriteStep,
	getPrevWriteStep,
	getWriteStepIndex,
	resolveWriteStep,
	WRITE_STEPS,
} from '../recordWriteFlow';

describe('recordWriteFlow — 질문 순서', () => {
	it('방문일 → 별점 → 사진 → 재방문 순서다 (시설 평가는 아직 없다)', () => {
		expect([...WRITE_STEPS]).toEqual(['date', 'rating', 'photos', 'revisit']);
	});

	it('저장된 단계가 없거나 알 수 없으면 첫 질문으로 돌린다', () => {
		expect(resolveWriteStep(undefined)).toBe('date');
		expect(resolveWriteStep('facility')).toBe('date');
		expect(resolveWriteStep('photos')).toBe('photos');
		expect(getWriteStepIndex('facility')).toBe(0);
	});

	it('앞뒤 이동은 끝에서 null을 돌려준다', () => {
		expect(getNextWriteStep('date')).toBe('rating');
		expect(getNextWriteStep('photos')).toBe('revisit');
		expect(getNextWriteStep('revisit')).toBeNull();
		expect(getPrevWriteStep('revisit')).toBe('photos');
		expect(getPrevWriteStep('rating')).toBe('date');
		expect(getPrevWriteStep('date')).toBeNull();
		expect(getPrevWriteStep(undefined)).toBeNull();
	});
});

describe('recordWriteFlow — 다음으로 넘어가는 조건', () => {
	it('방문일과 사진은 답 없이도 넘어갈 수 있다 (사진은 건너뛰기)', () => {
		expect(canAdvanceWriteStep('date', {})).toBe(true);
		expect(canAdvanceWriteStep('photos', {})).toBe(true);
	});

	it('별점은 필수다 — 0점·미입력이면 막고 0.5점부터 통과한다', () => {
		expect(canAdvanceWriteStep('rating', {})).toBe(false);
		expect(canAdvanceWriteStep('rating', { rating: 0 })).toBe(false);
		expect(canAdvanceWriteStep('rating', { rating: 0.5 })).toBe(true);
		expect(canAdvanceWriteStep('rating', { rating: 4.5 })).toBe(true);
	});

	it('재방문은 명시적으로 골라야 한다 — 미선택만 막고 false("처음")도 통과한다', () => {
		expect(canAdvanceWriteStep('revisit', {})).toBe(false);
		expect(canAdvanceWriteStep('revisit', { isRevisit: true })).toBe(true);
		expect(canAdvanceWriteStep('revisit', { isRevisit: false })).toBe(true);
	});
});
