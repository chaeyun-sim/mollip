import { act } from 'react';
import { createRoot } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EMPTY_PREFERRED_TASTE } from '@/src/utils/preferredTaste';
import type { PreferredTasteDetails } from '@/src/utils/preferredTaste';
import { useRecommendedExhibitions } from '../useRecommendedExhibitions';

const mockIn = jest.fn();
let mockRows: Record<string, unknown>[] = [];
// 좋아한 전시 메타(in id) · 같은 미술관 후보(in museum_id) 응답
let mockAffinityRows: Record<string, unknown>[] = [];
let mockMuseumRows: Record<string, unknown>[] = [];
let mockVisits: Record<string, unknown> = {};
jest.mock('@/src/utils/supabase', () => ({
	supabase: {
		from: jest.fn(() => {
			let inColumn: string | null = null;
			const query = {
				select: () => query,
				gte: () => query,
				order: () => query,
				limit: () => query,
				in: (...args: unknown[]) => {
					mockIn(...args);
					inColumn = String(args[0]);
					return query;
				},
				then: (resolve: (value: unknown) => void) => {
					if (inColumn === 'id') return resolve({ data: mockAffinityRows, error: null });
					if (inColumn === 'museum_id') return resolve({ data: mockMuseumRows, error: null });
					return resolve({ data: mockRows, error: null });
				},
			};
			return query;
		}),
	},
}));
jest.mock('@/src/store/visitStore', () => ({
	useVisitStore: (selector: (state: { visits: object }) => unknown) =>
		selector({ visits: mockVisits }),
}));
jest.mock('@/src/store/bookmarkStore', () => ({
	useBookmarkStore: (selector: (state: { ids: string[] }) => unknown) => selector({ ids: [] }),
}));

type HookResult = ReturnType<typeof useRecommendedExhibitions>;

const row = (id: number, genre: string, description: string, museumId: number | null = null) => ({
	id,
	museum_id: museumId,
	title: `전시 ${id}`,
	description,
	venue_name_fallback: '서울시립미술관',
	image_url: null,
	genre,
	tags: null,
	synced_at: null,
	start_date: '2026.01.01',
	end_date: '2099.12.31',
});

const renderRecommended = (
	genres: string[],
	artists: string[],
	taste: PreferredTasteDetails = EMPTY_PREFERRED_TASTE,
) => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const hookRef: { current: HookResult | null } = { current: null };
	function Harness() {
		hookRef.current = useRecommendedExhibitions(genres, artists, taste, true);
		return null;
	}
	const root = createRoot();
	act(() => {
		root.render(
			<QueryClientProvider client={client}>
				<Harness />
			</QueryClientProvider>,
		);
	});
	return {
		hookRef,
		unmount: () => {
			act(() => root.unmount());
			client.clear();
		},
	};
};

const waitForRecommended = async (hookRef: { current: HookResult | null }) => {
	for (let i = 0; i < 30 && hookRef.current?.isLoading; i += 1) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
	}
};

describe('useRecommendedExhibitions', () => {
	beforeEach(() => {
		mockIn.mockClear();
		mockVisits = {};
		mockAffinityRows = [];
		mockMuseumRows = [];
	});

	it('장르만 있으면 선호 장르로 조회 범위를 좁힌다', async () => {
		mockRows = [row(1, '회화', '')];
		const { hookRef, unmount } = renderRecommended(['회화'], []);
		await waitForRecommended(hookRef);

		expect(mockIn).toHaveBeenCalledWith('genre', ['회화']);
		expect(hookRef.current?.data.map((item) => item.id)).toEqual(['1']);
		unmount();
	});

	it('작가 취향이 있으면 선호 장르 밖 전시도 작가 일치로 추천한다', async () => {
		mockRows = [row(1, '회화', ''), row(2, '사진', '고흐의 편지를 사진으로 다시 읽는 전시')];
		const { hookRef, unmount } = renderRecommended(['회화'], ['고흐']);
		await waitForRecommended(hookRef);

		expect(mockIn).not.toHaveBeenCalled();
		expect(hookRef.current?.data.map((item) => [item.id, item.recommendationTags])).toEqual([
			['1', ['회화']],
			['2', ['고흐']],
		]);
		unmount();
	});

	it('"또 갈래요" 전시와 같은 미술관·장르 전시에 가점과 이유 태그를 붙인다', async () => {
		mockVisits = {
			'2026-10-01::id:50': {
				exhibitionId: '50',
				listened: [],
				status: 'confirmed',
				isRevisit: true,
			},
		};
		mockAffinityRows = [{ id: 50, museum_id: 7, genre: '사진' }];
		// 선호 장르(회화)로 좁혀 받은 후보
		mockRows = [row(1, '회화', '', 1), row(2, '회화', '', 7)];
		// 장르 필터에 걸려 빠지던 같은 미술관 전시
		mockMuseumRows = [row(3, '사진', '', 7)];
		const { hookRef, unmount } = renderRecommended(['회화'], []);
		await waitForRecommended(hookRef);

		expect(mockIn).toHaveBeenCalledWith('id', [50]);
		expect(mockIn).toHaveBeenCalledWith('museum_id', [7]);
		expect(hookRef.current?.data.map((item) => [item.id, item.recommendationTags])).toEqual([
			// 회화 40 + 같은 미술관 30
			['2', ['회화', 'revisit_venue']],
			// 같은 미술관 30 + 같은 장르 20
			['3', ['revisit_venue', 'revisit_genre']],
			['1', ['회화']],
		]);
		unmount();
	});

	it('"또 갈래요" 기록이 없으면 추가 요청을 보내지 않는다', async () => {
		mockRows = [row(1, '회화', '', 7)];
		const { hookRef, unmount } = renderRecommended(['회화'], []);
		await waitForRecommended(hookRef);

		expect(mockIn).toHaveBeenCalledTimes(1);
		expect(mockIn).toHaveBeenCalledWith('genre', ['회화']);
		unmount();
	});
});
