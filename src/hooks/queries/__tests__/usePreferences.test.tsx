import { act } from 'react';
import { createRoot } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePreferences } from '../usePreferences';

const mockSingle = jest.fn();
jest.mock('@/src/utils/supabase', () => ({
	supabase: {
		from: jest.fn(() => ({
			select: () => ({ eq: () => ({ single: mockSingle }) }),
		})),
	},
}));

type HookResult = ReturnType<typeof usePreferences>;

const renderPreferences = (userId: string | undefined) => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const hookRef: { current: HookResult | null } = { current: null };
	function Harness() {
		hookRef.current = usePreferences(userId);
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

const waitForPreferences = async (hookRef: { current: HookResult | null }) => {
	for (let i = 0; i < 30 && hookRef.current?.isLoading; i += 1) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
	}
};

beforeEach(() => {
	jest.clearAllMocks();
});

describe('usePreferences', () => {
	it('조회 중에는 빈 장르와 함께 isLoading=true를 돌려준다 — 빈 장르를 "취향 없음"으로 오해하지 않도록', async () => {
		let resolve: (value: unknown) => void = () => {};
		mockSingle.mockReturnValue(new Promise((r) => (resolve = r)));
		const { hookRef, unmount } = renderPreferences('user-a');

		expect(hookRef.current?.preferredGenres).toEqual([]);
		expect(hookRef.current?.isLoading).toBe(true);

		resolve({ data: { preferred_genres: ['회화'], preferred_artists: [] }, error: null });
		await waitForPreferences(hookRef);

		expect(hookRef.current?.preferredGenres).toEqual(['회화']);
		expect(hookRef.current?.isLoading).toBe(false);
		unmount();
	});

	it('비로그인이면 조회하지 않고 로딩도 아니다', () => {
		const { hookRef, unmount } = renderPreferences(undefined);

		expect(hookRef.current?.isLoading).toBe(false);
		expect(mockSingle).not.toHaveBeenCalled();
		unmount();
	});

	it('추가 취향 컬럼이 아직 없으면 기존 장르·작가 취향을 읽는다', async () => {
		mockSingle
			.mockResolvedValueOnce({ data: null, error: { code: '42703', message: 'missing column' } })
			.mockResolvedValueOnce({
				data: { preferred_genres: ['현대미술'], preferred_artists: ['고흐'] },
				error: null,
			});
		const { hookRef, unmount } = renderPreferences('user-a');
		await waitForPreferences(hookRef);

		expect(hookRef.current?.preferredGenres).toEqual(['현대미술']);
		expect(hookRef.current?.preferredArtists).toEqual(['고흐']);
		expect(hookRef.current?.isError).toBe(false);
		unmount();
	});
});
