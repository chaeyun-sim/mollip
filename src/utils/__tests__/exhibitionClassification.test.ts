import { inferGenreAndTags, sanitizeExhibitionTags } from '../exhibitionClassification';

describe('inferGenreAndTags — 어린이 태그', () => {
	it('제목에 어린이가 있으면 태그에 어린이', () => {
		const { tags } = inferGenreAndTags({ title: '어린이 체험전 여름방학' });
		expect(tags).toContain('어린이');
	});
	it('키즈도 어린이로 잡는다', () => {
		const { tags } = inferGenreAndTags({ title: '키즈 워크숍' });
		expect(tags).toContain('어린이');
	});
});

describe('sanitizeExhibitionTags', () => {
	it('레거시 키즈는 어린이로 바꾼다', () => {
		expect(sanitizeExhibitionTags(['키즈', '무료'])).toEqual(['어린이', '무료']);
	});
});
