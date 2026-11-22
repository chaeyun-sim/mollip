import { useBookmarkStore } from '../bookmarkStore';

const mockMatch = jest.fn((..._args: unknown[]) => Promise.resolve({ error: null }));
const mockUpsert = jest.fn((..._args: unknown[]) => Promise.resolve({ error: null }));

jest.mock('../authStore', () => ({
	useAuthStore: { getState: () => ({ user: { id: 'user-1' } }) },
}));

jest.mock('../../utils/supabase', () => ({
	supabase: {
		from: () => ({
			upsert: (...args: unknown[]) => mockUpsert(...args),
			delete: () => ({ match: (...args: unknown[]) => mockMatch(...args) }),
		}),
	},
}));

jest.mock('../../utils/authAwareStorage', () => ({
	createAuthAwareStorage: () => ({
		getItem: () => null,
		setItem: () => undefined,
		removeItem: () => undefined,
	}),
}));

describe('bookmarkStore.remove — 관람 확정 시 스크랩 해제', () => {
	beforeEach(() => {
		mockMatch.mockClear();
		mockUpsert.mockClear();
	});

	it('스크랩된 전시는 로컬과 서버에서 지운다', () => {
		useBookmarkStore.setState({ ids: ['7', '9'] });

		useBookmarkStore.getState().remove('7');

		expect(useBookmarkStore.getState().ids).toEqual(['9']);
		expect(mockMatch).toHaveBeenCalledWith({ user_id: 'user-1', exhibition_id: '7' });
	});

	it('스크랩되지 않은 전시는 아무것도 하지 않는다 — toggle처럼 새로 스크랩하지 않는다', () => {
		useBookmarkStore.setState({ ids: ['9'] });

		useBookmarkStore.getState().remove('7');

		expect(useBookmarkStore.getState().ids).toEqual(['9']);
		expect(mockMatch).not.toHaveBeenCalled();
		expect(mockUpsert).not.toHaveBeenCalled();
	});
});
