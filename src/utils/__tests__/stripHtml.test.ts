import { normalizeExhibitionTitle, stripHtml } from '../stripHtml';

describe('stripHtml — 이중 인코딩 엔티티', () => {
	it('&amp;middot; → ·', () => {
		expect(stripHtml('산수&amp;middot;격물')).toBe('산수·격물');
	});
	it('&amp;lt; &amp;gt; → < >', () => {
		expect(stripHtml('실감콘텐츠 체험전 &amp;lt;조선의 하늘과 땅&amp;gt;')).toBe(
			'실감콘텐츠 체험전 <조선의 하늘과 땅>',
		);
	});
	it('&amp;#39; → 따옴표', () => {
		expect(stripHtml('전시 &amp;#39;두 개의 시선&amp;#39;')).toBe("전시 '두 개의 시선'");
	});
	it('&amp;times; → ×', () => {
		expect(stripHtml('MMCA&amp;times;LG OLED')).toBe('MMCA×LG OLED');
	});
	it('&amp;amp; → &', () => {
		expect(stripHtml('PAIK &amp;amp; JUNG')).toBe('PAIK & JUNG');
	});
	it('공백을 무시하고 제목 키를 맞춘다', () => {
		expect(normalizeExhibitionTitle('MMCA 해외 명작 : 수련')).toBe(
			normalizeExhibitionTitle('MMCA 해외 명작: 수련'),
		);
	});
});
