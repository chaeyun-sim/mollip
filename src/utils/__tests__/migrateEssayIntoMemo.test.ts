import { migrateEssayIntoMemo } from '../migrateEssayIntoMemo';

describe('migrateEssayIntoMemo — rev1 essay를 memo로 이관', () => {
	it('memo가 비어있고 essay가 있으면 essay를 memo로 옮긴다', () => {
		const next = migrateEssayIntoMemo({ memo: '', essay: '빛과 그림자가 인상적이었다' });

		expect(next.memo).toBe('빛과 그림자가 인상적이었다');
		expect(next.essay).toBeUndefined();
	});

	it('memo가 없으면 essay를 memo로 옮긴다', () => {
		const next = migrateEssayIntoMemo({ memo: undefined, essay: '빛과 그림자가 인상적이었다' });

		expect(next.memo).toBe('빛과 그림자가 인상적이었다');
		expect(next.essay).toBeUndefined();
	});

	it('둘 다 값이 있으면 memo를 유지하고 essay는 버린다', () => {
		const next = migrateEssayIntoMemo({ memo: '한줄평만 남김', essay: '생성된 긴 감상문' });

		expect(next.memo).toBe('한줄평만 남김');
		expect(next.essay).toBeUndefined();
	});

	it('essay가 없으면 입력을 그대로 반환한다', () => {
		const input = { memo: '직접 쓴 감상평' };
		const next = migrateEssayIntoMemo(input);

		expect(next).toBe(input);
	});
});
