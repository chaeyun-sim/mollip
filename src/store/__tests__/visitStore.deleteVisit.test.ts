import { useVisitStore } from '../visitStore';

const mockUpsert = jest.fn((..._args: unknown[]) => Promise.resolve({ error: null }));

jest.mock('../authStore', () => ({
	useAuthStore: { getState: () => ({ user: { id: 'user-1' }, session: null }) },
}));

jest.mock('../../utils/supabase', () => ({
	supabase: {
		from: () => ({
			upsert: (...args: unknown[]) => mockUpsert(...args),
		}),
	},
}));

jest.mock('../../utils/localVisitDb', () => ({
	deleteLocalVisit: jest.fn(),
	loadAllLocalVisits: jest.fn(() => ({})),
	migrateVisitsFromAsyncStorage: jest.fn(),
	persistAllLocalVisits: jest.fn(),
	upsertLocalVisit: jest.fn(),
}));

jest.mock('../../utils/visitPhotoFiles', () => ({
	deleteManagedVisitPhotos: jest.fn(),
	persistLocalVisitPhoto: jest.fn((uri: string) => uri),
}));

describe('visitStore.deleteVisit — 원격 삭제 표시', () => {
	beforeEach(() => {
		mockUpsert.mockClear();
	});

	it('행을 지우지 않고 deleted_at을 남긴다 — 다른 기기가 다시 올려도 되살아나지 않게', async () => {
		const key = '2026-10-16::t:자비 솔라 특별전';
		useVisitStore.setState({
			visits: { [key]: { exhibitionId: null, exhibitionTitle: '자비 솔라 특별전', listened: [] } },
		});

		await useVisitStore.getState().deleteVisit(key);

		expect(useVisitStore.getState().visits[key]).toBeUndefined();
		expect(mockUpsert).toHaveBeenCalledTimes(1);
		const [payload, options] = mockUpsert.mock.calls[0] as [Record<string, unknown>, unknown];
		expect(payload).toMatchObject({
			user_id: 'user-1',
			visit_key: 't:자비 솔라 특별전',
			date: '2026-10-16',
			memo: null,
			rating: null,
			listened: [],
			signature_svg: null,
		});
		expect(typeof payload.deleted_at).toBe('string');
		expect(options).toEqual({ onConflict: 'user_id,visit_key,date' });
	});

	it('같은 기록을 새로 저장하면 deleted_at을 비워 되살린다', () => {
		useVisitStore.setState({ visits: {} });
		useVisitStore.getState().saveRecord({
			dateKey: '2026-10-16',
			exhibitionId: null,
			title: '자비 솔라 특별전',
			rating: 4,
			companion: 'friend',
			keywords: ['고요'],
			isRevisit: true,
		});

		const [payload] = mockUpsert.mock.calls[0] as [Record<string, unknown>];
		expect(payload).toMatchObject({
			deleted_at: null,
			rating: 4,
			companion: 'friend',
			keywords: ['고요'],
			is_revisit: true,
			visit_status: 'confirmed',
		});
	});
});
