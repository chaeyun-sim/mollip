import {
	EMPTY_PREFERRED_TASTE,
	matchPreferredArtist,
	matchPreferredArtists,
	matchPreferredTaste,
	matchPreferredTastes,
	normalizePreferredTaste,
} from '../preferredTaste';

describe('preferred taste details', () => {
	it('drops values outside the supported preference options', () => {
		expect(
			normalizePreferredTaste({
				moods: ['calm', 'unknown'],
				venueScales: 'large',
				artMovements: ['impressionism'],
			}),
		).toEqual({
			moods: ['calm'],
			venueScales: [],
			artMovements: ['impressionism'],
		});
		expect(normalizePreferredTaste(null)).toBe(EMPTY_PREFERRED_TASTE);
	});

	it('matches a selected art movement in exhibition text', () => {
		expect(
			matchPreferredTaste('한국 인상주의의 흐름을 소개합니다', '서울시립미술관', {
				moods: [],
				venueScales: [],
				artMovements: ['impressionism'],
			}),
		).toBe('인상주의');
	});

	it('matches a venue scale against venue name only', () => {
		expect(
			matchPreferredTaste('대형 미술관 전시', 'OO 아트스페이스', {
				moods: [],
				venueScales: ['small'],
				artMovements: [],
			}),
		).toBe('한 층의 작은 갤러리');
	});

	it('matches a saved artist name without case sensitivity', () => {
		expect(matchPreferredArtist('A Retrospective of Yayoi Kusama', ['kusama'])).toBe('kusama');
		expect(matchPreferredArtist('A group exhibition', ['Lee Ufan'])).toBeUndefined();
	});

	it('returns every supported preference actually present in exhibition data', () => {
		expect(
			matchPreferredTastes('현대미술과 인상주의를 다룬 차분한 전시', '서울시립미술관', {
				moods: ['calm', 'dreamy'],
				venueScales: ['large'],
				artMovements: ['contemporary', 'impressionism'],
			}),
		).toEqual(['차분한', '대형 미술관·박물관', '인상주의', '현대미술']);
		expect(matchPreferredArtists('고흐와 르네상스 전시', ['고흐', '르네상스', '모네'])).toEqual([
			'고흐',
			'르네상스',
		]);
	});
});
