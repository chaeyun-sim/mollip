import { clipToSentence } from '../clipToSentence';

describe('clipToSentence — 상한 안에서 문장 단위로 자르기', () => {
	it('상한 이하면 그대로 돌려준다', () => {
		expect(clipToSentence('좋았다.', 100)).toBe('좋았다.');
	});

	it('상한을 넘으면 마지막으로 끝난 문장까지만 남긴다', () => {
		expect(clipToSentence('첫 문장이다. 둘째 문장이다. 셋째 문장이다.', 10)).toBe('첫 문장이다.');
	});

	it('끝난 문장이 하나도 없으면 상한에서 자른다', () => {
		expect(clipToSentence('마침표 없이 길게 이어지는 글', 5)).toBe('마침표 없');
	});
});
