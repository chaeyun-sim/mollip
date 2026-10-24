import type { DayVisit } from '@/src/store/visitStore';

/** 갤러리 무대 높이 = 폭 대비 비율 */
const STAGE_HEIGHT_RATIO = 0.9;
/** 무대가 창 높이에서 차지할 수 있는 최대 비율 — 가로 모드에서 사진이 화면을 다 덮지 않게 */
const STAGE_MAX_WINDOW_RATIO = 0.62;
const STAGE_MIN_HEIGHT = 240;

/** 공백을 다듬고 빈 값·중복을 걸러낸다 — 먼저 나온 순서를 지킨다 */
const uniqueUris = (uris: (string | undefined)[]): string[] => {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const uri of uris) {
		const trimmed = uri?.trim();
		if (!trimmed || seen.has(trimmed)) continue;
		seen.add(trimmed);
		result.push(trimmed);
	}
	return result;
};

/**
 * 기록 상세에 보여줄 사진 목록.
 * `thumbnail`(티켓·포스터)과 `venuePhotos`(현장·작품·공간 사진)는 저장 경로마다 따로 쓰이므로 둘을 합쳐 읽는다.
 * 첫 장은 다이어리 벽의 대표 이미지와 같다. 실제 사진이 하나도 없을 때만 전시 포스터 → 들은 작품 이미지로 대체한다.
 */
export const buildVisitPhotos = (visit: DayVisit, fallbackUri?: string): string[] => {
	const own = uniqueUris([visit.thumbnail, ...(visit.venuePhotos ?? [])]);
	if (own.length > 0) return own;
	return uniqueUris([fallbackUri, ...visit.listened.map((item) => item.imageUrl)]);
};

/** 사진이 줄거나 비었을 때 오래된 인덱스가 범위를 벗어나지 않게 보정한다 */
export const clampPhotoIndex = (index: number, total: number): number => {
	if (total <= 0 || Number.isNaN(index)) return 0;
	return Math.min(Math.max(Math.round(index), 0), total - 1);
};

/**
 * 사진 목록이 바뀐 뒤 보여줄 인덱스. 보던 사진(uri)이 아직 있으면 그 사진을 따라가고,
 * 사라졌으면 옛 인덱스를 새 범위로 보정한다. 보정한 값을 상태로 저장해 다시 늘어나도 되살리지 않는다.
 */
export const resolveActiveIndex = (
	activeUri: string | undefined,
	activeIndex: number,
	photos: string[],
): number => {
	if (photos.length === 0) return 0;
	const found = activeUri === undefined ? -1 : photos.indexOf(activeUri);
	return found >= 0 ? found : clampPhotoIndex(activeIndex, photos.length);
};

/** 가로 스크롤 오프셋 → 현재 페이지. 폭을 아직 모르거나 바운스로 범위를 넘어도 안전하다 */
export const pageIndexFromOffset = (offsetX: number, pageWidth: number, total: number): number => {
	if (pageWidth <= 0) return 0;
	return clampPhotoIndex(offsetX / pageWidth, total);
};

export const galleryStageHeight = (width: number, windowHeight: number): number =>
	Math.round(
		Math.max(
			STAGE_MIN_HEIGHT,
			Math.min(width * STAGE_HEIGHT_RATIO, windowHeight * STAGE_MAX_WINDOW_RATIO),
		),
	);
