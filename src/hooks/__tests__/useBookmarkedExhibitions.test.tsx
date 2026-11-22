import { act } from 'react';
import { createRoot } from 'test-renderer';
import { useBookmarkedExhibitions } from '../useBookmarkedExhibitions';

const mockSelect = jest.fn();
let mockRows: Record<string, unknown>[] = [];
jest.mock('@/src/utils/supabase', () => ({
	supabase: {
		from: jest.fn(() => {
			const query = {
				select: (...args: unknown[]) => {
					mockSelect(...args);
					return query;
				},
				in: () => query,
				then: (resolve: (value: unknown) => void) => resolve({ data: mockRows, error: null }),
			};
			return query;
		}),
	},
}));
// 렌더마다 새 배열을 주면 effect가 무한 반복되므로 같은 배열을 돌려준다
const mockIds = ['7922'];
jest.mock('@/src/store/bookmarkStore', () => ({
	useBookmarkStore: (selector: (state: { ids: string[] }) => unknown) => selector({ ids: mockIds }),
}));

type HookResult = ReturnType<typeof useBookmarkedExhibitions>;

const renderHook = async () => {
	const result: { current: HookResult | null } = { current: null };
	const Probe = () => {
		result.current = useBookmarkedExhibitions();
		return null;
	};
	await act(async () => {
		createRoot().render(<Probe />);
	});
	return result;
};

describe('useBookmarkedExhibitions', () => {
	it('미술관 영문명을 venueEn으로 채우고, 한국어 장소는 그대로 둔다', async () => {
		mockRows = [
			{
				id: 7922,
				museum_id: 1150,
				title: '스페인 미술 500년',
				title_en: '500 Years of Spanish Art',
				venue_name_fallback: '예술의전당 서울서예박물관',
				event_site: '제1전시실',
				museums: { name_en: 'Seoul Calligraphy Art Museum' },
			},
		];

		const result = await renderHook();

		expect(String(mockSelect.mock.calls[0][0])).toContain('museums(name_en)');
		expect(result.current?.data[0]).toMatchObject({
			venue: '예술의전당 서울서예박물관 제1전시실',
			venueEn: 'Seoul Calligraphy Art Museum',
		});
	});
});
