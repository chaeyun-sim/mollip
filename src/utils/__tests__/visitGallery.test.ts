import type { DayVisit } from '@/src/store/visitStore';
import {
	buildVisitPhotos,
	clampPhotoIndex,
	galleryStageHeight,
	pageIndexFromOffset,
	resolveActiveIndex,
} from '../visitGallery';

const visit = (overrides: Partial<DayVisit> = {}): DayVisit => ({
	exhibitionId: null,
	exhibitionTitle: '전시',
	listened: [],
	status: 'confirmed',
	...overrides,
});

describe('buildVisitPhotos', () => {
	it('thumbnail 다음에 venuePhotos 순서로 합친다', () => {
		const photos = buildVisitPhotos(visit({ thumbnail: 'a', venuePhotos: ['b', 'c'] }));
		expect(photos).toEqual(['a', 'b', 'c']);
	});

	it('thumbnail 없이 venuePhotos만 있어도 모두 나온다', () => {
		expect(buildVisitPhotos(visit({ venuePhotos: ['b', 'c'] }))).toEqual(['b', 'c']);
	});

	it('공백을 다듬고 빈 값을 버리며 중복은 첫 번째만 남긴다', () => {
		const photos = buildVisitPhotos(
			visit({ thumbnail: ' a ', venuePhotos: ['', '  ', 'a', 'b', 'b', 'c'] }),
		);
		expect(photos).toEqual(['a', 'b', 'c']);
	});

	it('사진이 하나도 없으면 폴백 포스터를 쓴다', () => {
		expect(buildVisitPhotos(visit(), 'poster')).toEqual(['poster']);
	});

	it('폴백 포스터가 없으면 들은 작품 이미지를 중복 없이 쓴다', () => {
		const photos = buildVisitPhotos(
			visit({
				listened: [
					{ title: 'x', imageUrl: 'i1' },
					{ title: 'y' },
					{ title: 'z', imageUrl: 'i1' },
					{ title: 'w', imageUrl: 'i2' },
				],
			}),
		);
		expect(photos).toEqual(['i1', 'i2']);
	});

	it('실제 사진이 있으면 폴백은 섞지 않는다', () => {
		const photos = buildVisitPhotos(
			visit({ thumbnail: 'a', listened: [{ title: 'x', imageUrl: 'i1' }] }),
			'poster',
		);
		expect(photos).toEqual(['a']);
	});

	it('아무것도 없으면 빈 배열', () => {
		expect(buildVisitPhotos(visit())).toEqual([]);
		expect(buildVisitPhotos(visit({ thumbnail: '  ', venuePhotos: [] }), '  ')).toEqual([]);
	});
});

describe('clampPhotoIndex', () => {
	it('빈 배열이면 0', () => {
		expect(clampPhotoIndex(3, 0)).toBe(0);
	});

	it('범위 밖은 경계로 보정한다', () => {
		expect(clampPhotoIndex(-2, 4)).toBe(0);
		expect(clampPhotoIndex(9, 4)).toBe(3);
		expect(clampPhotoIndex(2, 4)).toBe(2);
	});

	it('NaN은 0', () => {
		expect(clampPhotoIndex(Number.NaN, 4)).toBe(0);
	});
});

describe('pageIndexFromOffset', () => {
	it('가장 가까운 페이지로 반올림한다', () => {
		expect(pageIndexFromOffset(0, 400, 3)).toBe(0);
		expect(pageIndexFromOffset(210, 400, 3)).toBe(1);
		expect(pageIndexFromOffset(790, 400, 3)).toBe(2);
	});

	it('폭을 모르거나 바운스로 범위를 넘어도 안전하다', () => {
		expect(pageIndexFromOffset(100, 0, 3)).toBe(0);
		expect(pageIndexFromOffset(-50, 400, 3)).toBe(0);
		expect(pageIndexFromOffset(5000, 400, 3)).toBe(2);
	});
});

describe('galleryStageHeight', () => {
	it('폭의 0.9배, 창 높이의 62%를 넘지 않는다', () => {
		expect(galleryStageHeight(400, 900)).toBe(360);
		expect(galleryStageHeight(400, 500)).toBe(310);
	});

	it('가로 모드처럼 창이 낮아도 최소 높이를 지킨다', () => {
		expect(galleryStageHeight(800, 300)).toBe(240);
	});
});

describe('resolveActiveIndex', () => {
	it('보던 사진이 그대로 있으면 위치가 바뀌어도 그 사진을 따라간다', () => {
		expect(resolveActiveIndex('c', 2, ['x', 'a', 'c', 'b'])).toBe(2);
		expect(resolveActiveIndex('c', 2, ['c', 'a', 'b'])).toBe(0);
	});

	it('사진이 줄어 보던 사진이 사라지면 마지막 장으로 보정한다', () => {
		expect(resolveActiveIndex('e', 4, ['a', 'b'])).toBe(1);
	});

	it('줄었다 다시 늘어도 옛 인덱스를 되살리지 않는다', () => {
		const shrunk = resolveActiveIndex('e', 4, ['a', 'b']);
		expect(shrunk).toBe(1);
		// 보정된 상태(b)에서 다시 5장으로 늘어도 b에 머문다
		expect(resolveActiveIndex('b', shrunk, ['a', 'b', 'c', 'd', 'e'])).toBe(1);
	});

	it('같은 장수로 통째 교체되면 보던 위치를 유지한다', () => {
		expect(resolveActiveIndex('b', 1, ['x', 'y', 'z'])).toBe(1);
	});

	it('빈 목록이거나 선택이 없으면 0', () => {
		expect(resolveActiveIndex('a', 3, [])).toBe(0);
		expect(resolveActiveIndex(undefined, 0, ['a', 'b'])).toBe(0);
	});
});
