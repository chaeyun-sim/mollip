import type { DayVisit } from '@/src/store/visitStore';
import { mergeRemoteVisits, type RemoteVisitRow } from '../mergeRemoteVisits';

const row = (overrides: Partial<RemoteVisitRow> = {}): RemoteVisitRow => ({
	visit_key: 't:자비 솔라 특별전',
	date: '2026-10-16',
	exhibition_id: null,
	memo: null,
	exhibition_title: '자비 솔라 특별전',
	venue: null,
	ticket_photo_url: null,
	venue_photo_urls: [],
	visit_status: 'confirmed',
	visit_started_at: null,
	visit_ended_at: null,
	rating: null,
	listened: [],
	signature_svg: null,
	companion: null,
	keywords: null,
	is_revisit: null,
	pending_since: null,
	deleted_at: null,
	...overrides,
});

const local = (overrides: Partial<DayVisit> = {}): DayVisit => ({
	exhibitionId: null,
	exhibitionTitle: '자비 솔라 특별전',
	listened: [],
	status: 'confirmed',
	...overrides,
});

const KEY = '2026-10-16::t:자비 솔라 특별전';

describe('mergeRemoteVisits — 삭제 동기화', () => {
	it('다른 기기에서 삭제 표시된 기록은 이 기기에서도 지우고 다시 올리지 않는다', () => {
		const result = mergeRemoteVisits([row({ deleted_at: '2026-11-20T10:00:00Z' })], {
			[KEY]: local({ rating: 4 }),
		});
		expect(result.visits[KEY]).toBeUndefined();
		expect(result.deletedKeys).toEqual([KEY]);
		expect(result.uploads).toEqual([]);
	});

	it('서버에 없는 확정 기록은 서버가 기준이므로 기기에서도 지우고 다시 올리지 않는다', () => {
		const result = mergeRemoteVisits([], {
			[KEY]: local({ rating: 5 }),
			'2026-10-10::t:mock1': local({ status: undefined, exhibitionTitle: undefined }),
		});
		expect(result.visits).toEqual({});
		expect(result.deletedKeys).toEqual([KEY, '2026-10-10::t:mock1']);
		expect(result.uploads).toEqual([]);
	});

	it('진행 중·미확정 기록은 아직 서버에 확정 전이라 기기에 남긴다', () => {
		const result = mergeRemoteVisits([], {
			[KEY]: local({ status: 'pending', pendingSince: '2026-10-16T02:00:00Z' }),
		});
		expect(result.visits[KEY]?.status).toBe('pending');
		expect(result.deletedKeys).toEqual([]);
		expect(result.uploads).toEqual([]);
	});
});

describe('mergeRemoteVisits — 새 필드', () => {
	it('서버에 저장된 별점·들은 작품·서명·동행·키워드·재방문을 그대로 받아온다 (새 기기)', () => {
		const result = mergeRemoteVisits(
			[
				row({
					rating: 3,
					listened: [{ title: '작품 A' }],
					signature_svg: '<svg/>',
					companion: 'family',
					keywords: ['빛'],
					is_revisit: true,
					visit_started_at: '2026-10-16T01:00:00Z',
					visit_ended_at: '2026-10-16T02:00:00Z',
				}),
			],
			{},
		);
		expect(result.visits[KEY]).toMatchObject({
			rating: 3,
			listened: [{ title: '작품 A' }],
			signatureSvg: '<svg/>',
			companion: 'family',
			keywords: ['빛'],
			isRevisit: true,
			status: 'confirmed',
			visitedAt: { start: '2026-10-16T01:00:00Z', end: '2026-10-16T02:00:00Z' },
		});
		expect(result.uploads).toEqual([]);
	});

	it('서버 값이 비어 있고 기기에만 있는 값은 한 번 올린다 (기존 데이터 이관)', () => {
		const result = mergeRemoteVisits([row()], {
			[KEY]: local({ rating: 4, listened: [{ title: '작품 B' }], isRevisit: false }),
		});
		expect(result.visits[KEY]).toMatchObject({ rating: 4, listened: [{ title: '작품 B' }] });
		expect(result.uploads).toEqual([
			{ key: KEY, patch: { rating: 4, listened: [{ title: '작품 B' }], is_revisit: false } },
		]);
	});

	it('다른 기기에서 확정한 기록은 이 기기의 미확정 상태보다 우선한다', () => {
		const result = mergeRemoteVisits([row({ visit_status: 'confirmed' })], {
			[KEY]: local({ status: 'pending', pendingSince: '2026-10-16T02:00:00Z' }),
		});
		expect(result.visits[KEY]?.status).toBe('confirmed');
		expect(result.visits[KEY]?.pendingSince).toBeUndefined();
	});

	it('서버의 종료(ended) 상태는 새 기기에서 미확정(pending)으로 복원한다', () => {
		const result = mergeRemoteVisits(
			[row({ visit_status: 'ended', pending_since: '2026-10-16T02:00:00Z' })],
			{},
		);
		expect(result.visits[KEY]?.status).toBe('pending');
		expect(result.visits[KEY]?.pendingSince).toBe('2026-10-16T02:00:00Z');
	});
});
