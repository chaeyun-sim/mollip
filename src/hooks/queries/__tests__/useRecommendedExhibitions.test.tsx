import { act } from 'react';
import { createRoot } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EMPTY_PREFERRED_TASTE } from '@/src/utils/preferredTaste';
import type { PreferredTasteDetails } from '@/src/utils/preferredTaste';
import { useRecommendedExhibitions } from '../useRecommendedExhibitions';

const mockIn = jest.fn();
let mockRows: Record<string, unknown>[] = [];
jest.mock('@/src/utils/supabase', () => ({
	supabase: {
		from: jest.fn(() => {
			const query = {
				select: () => query,
				gte: () => query,
				order: () => query,
				limit: () => query,
				in: (...args: unknown[]) => {
					mockIn(...args);
					return query;
				},
				then: (resolve: (value: unknown) => void) => resolve({ data: mockRows, error: null }),
			};
			return query;
		}),
	},
}));
jest.mock('@/src/store/visitStore', () => ({
	useVisitStore: (selector: (state: { visits: object }) => unknown) => selector({ visits: {} }),
}));
jest.mock('@/src/store/bookmarkStore', () => ({
	useBookmarkStore: (selector: (state: { ids: string[] }) => unknown) => selector({ ids: [] }),
}));

type HookResult = ReturnType<typeof useRecommendedExhibitions>;

const row = (id: number, genre: string, description: string) => ({
	id,
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
});
