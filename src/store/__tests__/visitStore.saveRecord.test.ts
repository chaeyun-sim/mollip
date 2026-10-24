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
	persistLocalVisitPhoto: jest.fn((uri: string) => uri),
}));

const base = {
	dateKey: '2026-10-09',
	exhibitionId: '7',
	title: '혼자 보긴 아까워서',
	venue: '경기도박물관',
	rating: 4,
	companion: 'friend' as const,
};

describe('visitStore.saveRecord — 기록하기 저장', () => {
	beforeEach(() => {
		mockUpsert.mockClear();
		useVisitStore.setState({ visits: {} });
	});

	it('새 관람을 확정 상태로 만들고 동행·키워드·별점을 남긴다', () => {
		const key = useVisitStore.getState().saveRecord({
			...base,
			memo: '  빛이 고요했다 ',
			keywords: ['고요한'],
			photos: ['file:///a.jpg'],
		});

		const visit = useVisitStore.getState().visits[key];
		expect(key).toBe(makeVisitKey('2026-10-09', '7', '혼자 보긴 아까워서'));
		expect(visit.keywords).not.toContain('재방문');
		expect(visit).toMatchObject({
			status: 'confirmed',
			rating: 4,
			memo: '빛이 고요했다',
			companion: 'friend',
			keywords: ['고요한'],
			venuePhotos: ['file:///a.jpg'],
		});
		expect(mockUpsert.mock.calls[0][0]).toMatchObject({
			exhibition_id: 7,
			memo: '빛이 고요했다',
			venue_photo_urls: ['file:///a.jpg'],
			visit_status: 'confirmed',
		});
	});

	it('도슨트로 남은 미확정 관람은 들은 작품을 지키며 확정으로 합친다', () => {
		const key = makeVisitKey('2026-10-09', '7', '혼자 보긴 아까워서');
		useVisitStore.setState({
			visits: {
				[key]: {
					exhibitionId: '7',
					listened: [{ title: '작품 A' }],
					status: 'pending',
					pendingSince: '2026-10-09T00:00:00.000Z',
				},
			},
		});

		useVisitStore.getState().saveRecord(base);

		const visit = useVisitStore.getState().visits[key];
		expect(visit.status).toBe('confirmed');
		expect(visit.pendingSince).toBeUndefined();
		expect(visit.listened).toEqual([{ title: '작품 A' }]);
	});

	it('재방문 여부를 DayVisit에 남기되 원격에는 보내지 않는다', () => {
		const key = useVisitStore.getState().saveRecord({ ...base, isRevisit: true });

		expect(useVisitStore.getState().visits[key].isRevisit).toBe(true);
		expect(mockUpsert.mock.calls[0][0]).not.toHaveProperty('isRevisit');
		expect(mockUpsert.mock.calls[0][0]).not.toHaveProperty('is_revisit');
	});

	it('재방문을 끈 채 저장하면 false로 남고, 값이 없으면 기존 값을 지킨다', () => {
		const key = useVisitStore.getState().saveRecord({ ...base, isRevisit: false });
		expect(useVisitStore.getState().visits[key].isRevisit).toBe(false);

		useVisitStore.setState({
			visits: { [key]: { ...useVisitStore.getState().visits[key], isRevisit: true } },
		});
		useVisitStore.getState().saveRecord(base);
		expect(useVisitStore.getState().visits[key].isRevisit).toBe(true);
	});

	it('키워드를 비우면 저장하지 않고, 메모가 공백뿐이면 원격에 보내지 않는다', () => {
		const key = useVisitStore.getState().saveRecord({ ...base, keywords: [], memo: '   ' });

		expect(useVisitStore.getState().visits[key].keywords).toBeUndefined();
		expect(mockUpsert.mock.calls[0][0]).not.toHaveProperty('memo');
	});
});
