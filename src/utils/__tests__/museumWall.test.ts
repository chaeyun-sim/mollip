import type { DayVisit } from '@/src/store/visitStore';
import {
	buildPreviewItem,
	buildWallMonths,
	frameShapeFor,
	pendingDaysLeft,
	toCaptionDate,
} from '../museumWall';

const visit = (overrides: Partial<DayVisit> = {}): DayVisit => ({
	exhibitionId: null,
	exhibitionTitle: '전시',
	listened: [],
	status: 'confirmed',
	...overrides,
});

describe('buildWallMonths', () => {
	it('확정 기록만 월별로 묶고 최신 월이 위로 온다', () => {
		const months = buildWallMonths({
			'2026-09-30::t:a': visit({ exhibitionTitle: 'A' }),
			'2026-10-02::t:b': visit({ exhibitionTitle: 'B' }),
			'2026-10-05::t:c': visit({ status: 'pending' }),
		});
		expect(months.map((m) => [m.monthKey, m.label, m.count])).toEqual([
			['2026-10', '2026년 10월', 1],
			['2026-09', '2026년 9월', 1],
		]);
	});

	it('같은 달은 방문일 내림차순으로 두 열에 나뉘고 첫 두 기록은 좌우로 갈린다', () => {
		const [month] = buildWallMonths({
			'2026-10-01::t:a': visit(),
			'2026-10-02::t:b': visit(),
			'2026-10-03::t:c': visit(),
		});
		expect(month.columns[0][0].dateKey).toBe('2026-10-03');
		expect(month.columns[1][0].dateKey).toBe('2026-10-02');
		expect(month.columns[0].length + month.columns[1].length).toBe(3);
	});

	it('이미지는 thumbnail → 포스터 → 내 사진 → 들은 작품 순으로 고른다', () => {
		const key = '2026-10-01::id:1';
		const base = visit({ exhibitionId: '1', listened: [{ title: 'x', imageUrl: 'listened' }] });
		const pick = (v: DayVisit, poster?: string) =>
			buildWallMonths({ [key]: v }, poster ? { [key]: poster } : {})[0].columns[0][0].imageUri;
		expect(pick({ ...base, thumbnail: 'thumb', venuePhotos: ['photo'] }, 'poster')).toBe('thumb');
		expect(pick({ ...base, venuePhotos: ['photo'] }, 'poster')).toBe('poster');
		expect(pick({ ...base, venuePhotos: ['photo'] })).toBe('photo');
		expect(pick(base)).toBe('listened');
	});

	it('전시명이 없으면 대체 제목을 쓴다', () => {
		const [month] = buildWallMonths({
			'2026-10-01::manual': visit({ exhibitionTitle: undefined }),
		});
		expect(month.columns[0][0].title).toBe('제목 없는 전시');
	});

	it('"-"만 적힌 전시명·장소는 비어 있는 것으로 본다', () => {
		const [month] = buildWallMonths({
			'2026-10-01::manual': visit({ exhibitionTitle: '-', venue: '-' }),
		});
		const item = month.columns[0][0];
		expect(item.title).toBe('제목 없는 전시');
		expect(item.venue).toBeUndefined();
	});

	it('기록이 없으면 빈 배열', () => {
		expect(buildWallMonths({})).toEqual([]);
	});
});

describe('frameShapeFor', () => {
	it('같은 키는 항상 같은 모양이다', () => {
		expect(frameShapeFor('2026-10-01::id:1')).toBe(frameShapeFor('2026-10-01::id:1'));
	});
});

describe('pendingDaysLeft', () => {
	const now = new Date('2026-10-12T12:00:00Z');
	it('방금 전환된 기록은 7일', () => {
		expect(pendingDaysLeft('2026-10-12T12:00:00Z', now)).toBe(7);
	});
	it('하루 미만이 남아도 1일로 센다', () => {
		expect(pendingDaysLeft('2026-10-05T18:00:00Z', now)).toBe(1);
	});
	it('만료됐거나 시각이 없으면 0', () => {
		expect(pendingDaysLeft('2026-10-01T00:00:00Z', now)).toBe(0);
		expect(pendingDaysLeft(undefined, now)).toBe(0);
	});
});

describe('toCaptionDate', () => {
	it('MM.DD 형식', () => {
		expect(toCaptionDate('2026-10-09')).toBe('10.09');
	});
});

describe('buildPreviewItem', () => {
	it('저장 후 벽에 걸릴 액자와 같은 키·모양으로 만든다', () => {
		const preview = buildPreviewItem({
			dateKey: '2026-10-01',
			exhibitionId: '7',
			title: '전시',
			imageUri: 'poster',
			memo: '한 줄',
			rating: 4,
		});
		const [month] = buildWallMonths({
			'2026-10-01::id:7': visit({
				exhibitionId: '7',
				thumbnail: 'poster',
				memo: '한 줄',
				rating: 4,
			}),
		});
		expect(preview.visitKey).toBe('2026-10-01::id:7');
		expect(preview.shape).toBe(month.columns[0][0].shape);
		expect(preview.imageUri).toBe('poster');
		expect(preview.memo).toBe('한 줄');
	});
});
