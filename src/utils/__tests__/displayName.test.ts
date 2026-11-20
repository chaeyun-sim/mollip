import { toDisplayName } from '@/src/utils/displayName';

describe('toDisplayName', () => {
	it('짧은 이름은 그대로 반환한다', () => {
		expect(toDisplayName('심채윤')).toBe('심채윤');
	});

	it('한글이 아닌 이름은 띄어쓰기가 있으면 첫 단어만 쓴다', () => {
		expect(toDisplayName('John Doe')).toBe('John');
		expect(toDisplayName('  Mary   Jane Watson ')).toBe('Mary');
	});

	it('한글 이름은 띄어쓰기가 있어도 그대로 쓴다', () => {
		expect(toDisplayName('심 채윤')).toBe('심 채윤');
		expect(toDisplayName(' 남궁 민수 ')).toBe('남궁 민수');
	});

	it('최대 글자 수를 넘으면 자르고 말줄임표를 붙인다', () => {
		expect(toDisplayName('가나다라마바사아자차카타파하')).toBe('가나다라마바사아자차…');
		expect(toDisplayName('Maximilianoalexander Doe')).toBe('Maximilian…');
	});

	it('정확히 최대 글자 수면 자르지 않는다', () => {
		expect(toDisplayName('가나다라마바사아자차')).toBe('가나다라마바사아자차');
	});

	it('이모지를 반쪽으로 자르지 않는다', () => {
		expect(toDisplayName('😀😀😀😀😀😀😀😀😀😀😀')).toBe('😀😀😀😀😀😀😀😀😀😀…');
	});

	it('비어 있거나 공백뿐이면 빈 문자열을 반환한다', () => {
		expect(toDisplayName('')).toBe('');
		expect(toDisplayName('   ')).toBe('');
		expect(toDisplayName(undefined)).toBe('');
	});
});
