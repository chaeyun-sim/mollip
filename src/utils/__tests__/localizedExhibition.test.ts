import { localizeExhibition } from '@/src/utils/localizedExhibition';

const item = {
	title: ' 파리의 이방인 ',
	titleEn: ' Korean Artists in France ',
	venue: '국립현대미술관 덕수궁관',
	venueEn: 'MMCA Deoksugung',
};

describe('localizeExhibition', () => {
	it('영어 설정이면 영문 제목·장소를 trim해서 반환한다', () => {
		expect(localizeExhibition(item, 'en')).toEqual({
			title: 'Korean Artists in France',
			venue: 'MMCA Deoksugung',
		});
	});

	it('한국어 설정이면 영문 값이 있어도 한국어를 반환한다', () => {
		expect(localizeExhibition(item, 'ko')).toEqual({
			title: '파리의 이방인',
			venue: '국립현대미술관 덕수궁관',
		});
	});

	it('영문 값이 null·빈 문자열·공백이면 한국어로 폴백한다', () => {
		expect(localizeExhibition({ ...item, titleEn: null, venueEn: '  ' }, 'en')).toEqual({
			title: '파리의 이방인',
			venue: '국립현대미술관 덕수궁관',
		});
		expect(localizeExhibition({ title: '산수', venue: '' }, 'en')).toEqual({
			title: '산수',
			venue: '',
		});
	});
});
