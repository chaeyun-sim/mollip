import { searchArtworks } from '@/src/api/artworkSearch';
import { searchWikiArtworks } from '@/src/api/wikidata';
import { searchMetArtworks } from '@/src/api/met';
import { searchAicArtworks } from '@/src/api/aic';
import { searchEuropeanaArtworks } from '@/src/api/europeana';

jest.mock('@/src/api/wikidata', () => ({ searchWikiArtworks: jest.fn() }));
jest.mock('@/src/api/met', () => ({ searchMetArtworks: jest.fn() }));
jest.mock('@/src/api/aic', () => ({ searchAicArtworks: jest.fn() }));
jest.mock('@/src/api/europeana', () => ({ searchEuropeanaArtworks: jest.fn() }));

it('keeps only titles or artists matching the search term', async () => {
	jest.mocked(searchWikiArtworks).mockResolvedValue([]);
	jest.mocked(searchMetArtworks).mockResolvedValue([
		{
			id: 'met:1',
			source: 'met',
			label: 'Starry Night',
			artist: 'Vincent van Gogh',
			description: '',
		},
		{
			id: 'met:2',
			source: 'met',
			label: 'Charity',
			artist: 'Guido Reni',
			description: 'Van Gogh collection',
		},
	]);
	jest
		.mocked(searchAicArtworks)
		.mockResolvedValue([
			{ id: 'aic:1', source: 'aic', label: 'Van Gogh Self Portrait', description: '' },
		]);
	jest.mocked(searchEuropeanaArtworks).mockResolvedValue([]);

	const results = await searchArtworks('van gogh');
	expect(results.map((artwork) => artwork.id)).toEqual(['met:1', 'aic:1']);
});
