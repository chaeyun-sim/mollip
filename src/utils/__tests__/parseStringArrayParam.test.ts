import { parseStringArrayParam } from '@/src/utils/parseStringArrayParam';

describe('parseStringArrayParam', () => {
	it('JSON 문자열 배열을 복원한다', () => {
		expect(parseStringArrayParam('["회화","","p1"]')).toEqual(['회화', '', 'p1']);
	});

	it('빈 배열도 그대로 복원한다', () => {
		expect(parseStringArrayParam('[]')).toEqual([]);
	});

	it('값이 없으면 undefined', () => {
		expect(parseStringArrayParam(undefined)).toBeUndefined();
		expect(parseStringArrayParam('')).toBeUndefined();
	});

	it('형식이 틀리면 undefined', () => {
		expect(parseStringArrayParam('not json')).toBeUndefined();
		expect(parseStringArrayParam('{"a":1}')).toBeUndefined();
		expect(parseStringArrayParam('[1,2]')).toBeUndefined();
	});
});
