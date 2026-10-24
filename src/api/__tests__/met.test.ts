import { searchMetArtworks } from '@/src/api/met';

const jsonResponse = (body: unknown, status = 200) =>
	({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe('searchMetArtworks — Met 검색', () => {
	const fetchMock = jest.fn();

	beforeEach(() => {
		fetchMock.mockReset();
		global.fetch = fetchMock as unknown as typeof fetch;
	});

	it('2026-10-01 폐기된 v1 대신 v1.1 검색을 쓰고, 상세 조회할 만큼만 limit으로 받는다', async () => {
		fetchMock.mockImplementation(async (url: string) => {
			// 폐기된 v1/search는 410 Gone을 돌려준다
			if (url.includes('/v1/search')) return jsonResponse({ message: 'retired' }, 410);
			if (url.includes('/v1.1/search')) return jsonResponse({ total: 1, objectIDs: [436535] });
			return jsonResponse({
				objectID: 436535,
				title: 'Wheat Field with Cypresses',
				artistDisplayName: 'Vincent van Gogh',
				primaryImageSmall: 'https://images.metmuseum.org/x.jpg',
			});
		});

		const results = await searchMetArtworks('van gogh');

		const searchUrl = String(fetchMock.mock.calls[0][0]);
		expect(searchUrl).toContain('/public/collection/v1.1/search?');
		expect(searchUrl).toContain('limit=12');
		expect(results.map((artwork) => artwork.id)).toEqual(['met:436535']);
	});
});
