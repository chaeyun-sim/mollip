import { buildCreditLine } from '../visitCredit';

describe('buildCreditLine', () => {
	it('작가와 장소가 모두 있으면 슬래시로 잇는다', () => {
		expect(buildCreditLine('김환기', '국립현대미술관')).toBe('김환기 / 국립현대미술관');
	});

	it('한쪽만 있으면 슬래시 없이 그 값만', () => {
		expect(buildCreditLine(undefined, '리움미술관')).toBe('리움미술관');
		expect(buildCreditLine('김환기', undefined)).toBe('김환기');
	});

	it('공백·"-"만 있는 값은 없는 것으로 본다', () => {
		expect(buildCreditLine('  ', '-')).toBeUndefined();
		expect(buildCreditLine(' - ', '리움미술관')).toBe('리움미술관');
	});

	it('둘 다 없으면 undefined(행을 숨긴다)', () => {
		expect(buildCreditLine(undefined, undefined)).toBeUndefined();
	});

	it('작가와 장소가 같은 글자면 한 번만 쓴다', () => {
		expect(buildCreditLine('리움미술관', '리움미술관')).toBe('리움미술관');
	});
});
