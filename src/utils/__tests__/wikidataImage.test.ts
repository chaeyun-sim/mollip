import { artworkTitleCandidates, normalizeWikiTitle, titlesAreClose } from '../wikidataImage';

describe('normalizeWikiTitle', () => {
	it('공백과 따옴표를 제거한다', () => {
		expect(normalizeWikiTitle('『자식을 잡아먹는 사투르누스』')).toBe('자식을잡아먹는사투르누스');
	});
});

describe('titlesAreClose', () => {
	it('같은 작품 제목은 가깝다', () => {
		expect(titlesAreClose('자식을 잡아먹는 사투르누스', '자식을 잡아먹는 사투르누스')).toBe(true);
	});

	it('한쪽이 다른 쪽을 포함하면 가깝다', () => {
		expect(titlesAreClose('모나리자', '모나리자 (레오나르도 다 빈치)')).toBe(true);
	});

	it('한 글자 제목은 거절한다', () => {
		expect(titlesAreClose('별', '별이 빛나는 밤')).toBe(false);
	});

	it('전혀 다른 제목은 거절한다', () => {
		expect(titlesAreClose('자식을 잡아먹는 사투르누스', '별이 빛나는 밤')).toBe(false);
	});
});

describe('artworkTitleCandidates', () => {
	it('해설 첫 문장에서 의~는 작품명을 뽑는다', () => {
		expect(
			artworkTitleCandidates(
				'프란시스코 고야의 자식을 잡아먹는 사투르누스는 1819…',
				undefined,
				'프란시스코 고야의 자식을 잡아먹는 사투르누스는 1819년에서 1823년 사이에 그린 작품이다.',
			),
		).toContain('자식을 잡아먹는 사투르누스');
	});

	it('『제목』을 후보로 넣는다', () => {
		expect(
			artworkTitleCandidates('촬영한 작품', undefined, '고야의 『자식을 잡아먹는 사투르누스』는'),
		).toContain('자식을 잡아먹는 사투르누스');
	});

	it('촬영한 작품만 있으면 후보가 없다', () => {
		expect(artworkTitleCandidates('촬영한 작품')).toEqual([]);
	});
});
