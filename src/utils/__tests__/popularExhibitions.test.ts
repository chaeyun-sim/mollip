import {
	buildPopularExhibitions,
	sortPopularEntries,
	type PopularEntry,
} from '../popularExhibitions';
import type { ExhibitionSummary } from '../../hooks/useExploreScreenData';

function makeDisplay(id: string): ExhibitionSummary {
	return {
		id,
		title: `전시 ${id}`,
		venue: '테스트 미술관',
		thumbnail: null,
		status: 'ongoing',
	};
}

function makeDisplayMap(ids: string[]): Map<string, ExhibitionSummary> {
	return new Map(ids.map((id) => [id, makeDisplay(id)]));
}

describe('sortPopularEntries', () => {
	it('점수 내림차순으로 정렬한다', () => {
		const entries: PopularEntry[] = [
			{ exhibitionId: 'a', score: 1 },
			{ exhibitionId: 'b', score: 5 },
			{ exhibitionId: 'c', score: 3 },
		];

		expect(sortPopularEntries(entries).map((e) => e.exhibitionId)).toEqual(['b', 'c', 'a']);
	});

	it('점수가 같으면 exhibition_id 오름차순으로 고정한다', () => {
		const entries: PopularEntry[] = [
			{ exhibitionId: '30', score: 2 },
			{ exhibitionId: '10', score: 2 },
			{ exhibitionId: '20', score: 2 },
		];

		expect(sortPopularEntries(entries).map((e) => e.exhibitionId)).toEqual(['10', '20', '30']);
	});

	it('입력 배열을 변형하지 않는다', () => {
		const entries: PopularEntry[] = [
			{ exhibitionId: 'a', score: 1 },
			{ exhibitionId: 'b', score: 2 },
		];

		sortPopularEntries(entries);

		expect(entries.map((e) => e.exhibitionId)).toEqual(['a', 'b']);
	});
});

describe('buildPopularExhibitions', () => {
	it('점수 순서대로 표시 정보를 결합한다', () => {
		const result = buildPopularExhibitions({
			entries: [
				{ exhibitionId: '1', score: 1 },
				{ exhibitionId: '2', score: 9 },
			],
			displayById: makeDisplayMap(['1', '2']),
		});

		expect(result.map((e) => e.id)).toEqual(['2', '1']);
	});

	it('표시 정보가 없는 ID는 제외한다', () => {
		const result = buildPopularExhibitions({
			entries: [
				{ exhibitionId: 'missing', score: 10 },
				{ exhibitionId: '1', score: 5 },
			],
			displayById: makeDisplayMap(['1']),
		});

		expect(result.map((e) => e.id)).toEqual(['1']);
	});

	it('excludeIds에 포함된 전시는 제외한다', () => {
		const result = buildPopularExhibitions({
			entries: [
				{ exhibitionId: '1', score: 10 },
				{ exhibitionId: '2', score: 5 },
			],
			displayById: makeDisplayMap(['1', '2']),
			excludeIds: ['1'],
		});

		expect(result.map((e) => e.id)).toEqual(['2']);
	});

	it('limit 개수까지만 반환한다', () => {
		const ids = ['1', '2', '3', '4'];
		const result = buildPopularExhibitions({
			entries: ids.map((id, i) => ({ exhibitionId: id, score: 10 - i })),
			displayById: makeDisplayMap(ids),
			limit: 2,
		});

		expect(result.map((e) => e.id)).toEqual(['1', '2']);
	});

	it('중복 ID는 한 번만 포함한다', () => {
		const result = buildPopularExhibitions({
			entries: [
				{ exhibitionId: '1', score: 10 },
				{ exhibitionId: '1', score: 4 },
				{ exhibitionId: '2', score: 2 },
			],
			displayById: makeDisplayMap(['1', '2']),
		});

		expect(result.map((e) => e.id)).toEqual(['1', '2']);
	});

	it('결과가 없으면 빈 배열을 반환한다', () => {
		const result = buildPopularExhibitions({
			entries: [],
			displayById: makeDisplayMap(['1']),
		});

		expect(result).toEqual([]);
	});
});
