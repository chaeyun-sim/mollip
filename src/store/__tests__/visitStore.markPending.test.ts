import { makeVisitKey, useVisitStore } from '../visitStore';

const mockUpsert = jest.fn((..._args: unknown[]) => Promise.resolve({ error: null }));

jest.mock('../authStore', () => ({
	useAuthStore: { getState: () => ({ user: { id: 'user-1' } }) },
}));

jest.mock('../../utils/supabase', () => ({
	supabase: { from: () => ({ upsert: (...args: unknown[]) => mockUpsert(...args) }) },
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
	persistLocalVisitPhoto: jest.fn(() => null),
}));

const meta = { start: '2026-10-04T01:00:00.000Z', end: '2026-10-04T02:00:00.000Z' };
const visitKey = makeVisitKey('2026-10-04', '1', '전시');

describe('visitStore.markPending 원격 동기화', () => {
	beforeEach(() => {
		mockUpsert.mockClear();
		useVisitStore.setState({ visits: {} });
	});

	it('기록된 방문이면 종료 시각과 ended 상태를 원격에 저장한다', () => {
		useVisitStore.setState({ visits: { [visitKey]: { exhibitionId: '1', listened: [] } } });

		useVisitStore.getState().markPending(visitKey, meta);

		expect(mockUpsert).toHaveBeenCalledTimes(1);
		expect(mockUpsert.mock.calls[0][0]).toMatchObject({
			user_id: 'user-1',
			visit_started_at: meta.start,
			visit_ended_at: meta.end,
			visit_status: 'ended',
		});
	});

	it('이미 확정된 방문은 로컬 상태를 바꾸지 않으므로 원격에도 쓰지 않는다', () => {
		useVisitStore.setState({
			visits: { [visitKey]: { exhibitionId: '1', listened: [], status: 'confirmed' } },
		});

		useVisitStore.getState().markPending(visitKey, meta);

		expect(useVisitStore.getState().visits[visitKey]?.status).toBe('confirmed');
		expect(mockUpsert).not.toHaveBeenCalled();
	});

	it('로컬에 없는 방문이면 원격에 쓰지 않는다', () => {
		useVisitStore.getState().markPending(visitKey, meta);

		expect(mockUpsert).not.toHaveBeenCalled();
	});
});
