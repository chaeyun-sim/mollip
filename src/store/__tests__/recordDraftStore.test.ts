import { useRecordDraftStore } from '../recordDraftStore';

describe('recordDraftStore — 재방문 여부', () => {
	beforeEach(() => {
		useRecordDraftStore.getState().reset();
	});

	it('감상 단계에서 patch한 isRevisit가 다음 patch 후에도 유지된다', () => {
		const { start, patch } = useRecordDraftStore.getState();
		start({ exhibitionId: '1', title: '전시' });
		expect(useRecordDraftStore.getState().draft?.isRevisit).toBeUndefined();

		patch({ isRevisit: true });
		patch({ rating: 4 });
		expect(useRecordDraftStore.getState().draft).toMatchObject({ isRevisit: true, rating: 4 });

		patch({ isRevisit: false });
		expect(useRecordDraftStore.getState().draft?.isRevisit).toBe(false);
	});

	it('질문 단계(writeStep)와 앞서 한 답이 질문을 오가도 함께 유지된다', () => {
		const { start, patch } = useRecordDraftStore.getState();
		start({ exhibitionId: '1', title: '전시' });
		expect(useRecordDraftStore.getState().draft?.writeStep).toBeUndefined();

		patch({ rating: 3.5, writeStep: 'photos' });
		patch({ writeStep: 'revisit', isRevisit: false });
		patch({ writeStep: 'rating' });

		expect(useRecordDraftStore.getState().draft).toMatchObject({
			writeStep: 'rating',
			rating: 3.5,
			isRevisit: false,
		});
	});

	it('reset하면 다음 기록에 이전 재방문 값이 새지 않는다', () => {
		const { start, patch, reset } = useRecordDraftStore.getState();
		start({ exhibitionId: '1', title: '전시' });
		patch({ isRevisit: true, writeStep: 'revisit' });
		reset();
		start({ exhibitionId: '2', title: '다른 전시' });
		expect(useRecordDraftStore.getState().draft?.isRevisit).toBeUndefined();
		expect(useRecordDraftStore.getState().draft?.writeStep).toBeUndefined();
	});
});
