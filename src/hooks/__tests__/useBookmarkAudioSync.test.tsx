import { act } from 'react';
import { createRoot } from 'test-renderer';
import { useBookmarkAudioStore } from '@/src/store/bookmarkAudioStore';
import { useBookmarkAudioSync } from '../useBookmarkAudioSync';

let mockResponse: { data: unknown; error: { message: string } | null } = { data: [], error: null };
jest.mock('@/src/utils/supabase', () => ({
	supabase: {
		from: jest.fn(() => {
			const query = {
				select: () => query,
				eq: () => query,
				then: (resolve: (value: unknown) => void) => resolve(mockResponse),
			};
			return query;
		}),
	},
}));
jest.mock('@/src/store/authStore', () => ({
	useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
		selector({ user: { id: 'user-1' } }),
}));
jest.mock('@/src/utils/authAwareStorage', () => ({
	createAuthAwareStorage: () => ({
		getItem: () => null,
		setItem: () => undefined,
		removeItem: () => undefined,
	}),
}));

const Probe = () => {
	useBookmarkAudioSync();
	return null;
};

const renderSync = async () => {
	await act(async () => {
		createRoot().render(<Probe />);
	});
};

describe('useBookmarkAudioSync', () => {
	beforeEach(() => {
		useBookmarkAudioStore.setState({ ids: [], isRemoteLoaded: false });
	});

	it('서버에서 받으면 동기화 완료로 표시한다', async () => {
		mockResponse = { data: [{ audio_guide_id: 'a1' }], error: null };
		await renderSync();
		expect(useBookmarkAudioStore.getState()).toMatchObject({ ids: ['a1'], isRemoteLoaded: true });
	});

	it('실패해도 스켈레톤이 멈추지 않게 완료로 표시한다', async () => {
		mockResponse = { data: null, error: { message: 'network' } };
		await renderSync();
		expect(useBookmarkAudioStore.getState().isRemoteLoaded).toBe(true);
	});
});
