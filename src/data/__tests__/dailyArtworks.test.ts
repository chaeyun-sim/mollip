import { DAILY_ARTWORKS } from '../dailyArtworks';

describe('DAILY_ARTWORKS — 오늘의 명화 큐레이션', () => {
	it('두 달 이상 겹치지 않을 만큼 작품이 있다', () => {
		expect(DAILY_ARTWORKS.length).toBeGreaterThanOrEqual(60);
	});

	it('Met objectID가 중복되지 않는다', () => {
		const ids = DAILY_ARTWORKS.map((artwork) => artwork.metObjectId);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('모든 작품에 제목·작가·연도가 채워져 있다', () => {
		const blanks = DAILY_ARTWORKS.filter(
			(artwork) => !artwork.title.trim() || !artwork.artist.trim() || !artwork.year.trim(),
		);
		expect(blanks).toEqual([]);
	});

	it('같은 작가가 연달아 나오지 않는다 (순환 경계 포함)', () => {
		const repeats = DAILY_ARTWORKS.filter(
			(artwork, index) =>
				artwork.artist === DAILY_ARTWORKS[(index + 1) % DAILY_ARTWORKS.length].artist,
		).map((artwork) => artwork.title);
		expect(repeats).toEqual([]);
	});
});
