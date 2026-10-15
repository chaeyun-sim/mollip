import type { DayVisit } from '@/src/store/visitStore';
import { dateKeyOf, makeVisitKey, PENDING_EXPIRY_MS } from '@/src/utils/visitKey';

export type FrameShape = 'portrait' | 'square' | 'landscape';

/** 액자 폭 대비 높이 비율 — 세로 3:4 / 정사각 / 가로 4:3 */
export const FRAME_HEIGHT_RATIO: Record<FrameShape, number> = {
	portrait: 4 / 3,
	square: 1,
	landscape: 3 / 4,
};

const SHAPES: FrameShape[] = ['portrait', 'square', 'landscape'];
/** 캡션 라벨이 차지하는 높이(폭 대비)의 근사값 — 열 높이 균형용 */
const CAPTION_HEIGHT_RATIO = 0.5;

export interface WallItem {
	visitKey: string;
	shape: FrameShape;
	title: string;
	venue?: string;
	dateKey: string;
	memo?: string;
	rating?: number;
	imageUri?: string;
}

export interface WallMonth {
	monthKey: string;
	label: string;
	count: number;
	columns: [WallItem[], WallItem[]];
}

const hashOf = (key: string): number => {
	let hash = 0;
	for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 100003;
	return hash;
};

/** 같은 기록은 항상 같은 모양 — 다시 그려도 벽이 흔들리지 않는다 */
export const frameShapeFor = (visitKey: string): FrameShape => SHAPES[hashOf(visitKey) % 3];

const pickImageUri = (visit: DayVisit, posterUrl?: string): string | undefined =>
	visit.thumbnail ??
	posterUrl ??
	visit.venuePhotos?.[0] ??
	visit.listened.find((l) => l.imageUrl)?.imageUrl;

/** 비어 있거나 "-"만 적힌 값은 없는 것으로 본다 — 직접 기록·옛 데이터에 남아 있다 */
export const cleanText = (value?: string): string | undefined => {
	const trimmed = value?.trim();
	return trimmed && trimmed !== '-' ? trimmed : undefined;
};

export const toWallItem = (visitKey: string, visit: DayVisit, posterUrl?: string): WallItem => ({
	visitKey,
	shape: frameShapeFor(visitKey),
	title: cleanText(visit.exhibitionTitle) ?? '제목 없는 전시',
	venue: cleanText(visit.venue),
	dateKey: dateKeyOf(visitKey),
	memo: cleanText(visit.memo),
	rating: visit.rating,
	imageUri: pickImageUri(visit, posterUrl),
});

/** 확정된 기록을 월별로 묶고, 각 월을 높이가 낮은 열부터 채워 2열 벽으로 배치한다 */
export const buildWallMonths = (
	visits: Record<string, DayVisit>,
	posterUrls: Record<string, string> = {},
): WallMonth[] => {
	const items = Object.entries(visits)
		.filter(([, visit]) => visit.status === 'confirmed')
		.map(([key, visit]) => toWallItem(key, visit, posterUrls[key]))
		.sort((a, b) => b.dateKey.localeCompare(a.dateKey) || a.visitKey.localeCompare(b.visitKey));

	const byMonth = new Map<string, WallItem[]>();
	for (const item of items) {
		const monthKey = item.dateKey.slice(0, 7);
		byMonth.set(monthKey, [...(byMonth.get(monthKey) ?? []), item]);
	}

	return [...byMonth.entries()].map(([monthKey, monthItems]) => {
		const columns: [WallItem[], WallItem[]] = [[], []];
		const heights = [0, 0];
		for (const item of monthItems) {
			const target = heights[1] < heights[0] ? 1 : 0;
			columns[target].push(item);
			heights[target] += FRAME_HEIGHT_RATIO[item.shape] + CAPTION_HEIGHT_RATIO;
		}
		const [year, month] = monthKey.split('-').map(Number);
		return { monthKey, label: `${year}년 ${month}월`, count: monthItems.length, columns };
	});
};

/** 기록 대기(pending) 관람이 만료되기까지 남은 일수 — 하루 미만이어도 1일로 센다 */
export const pendingDaysLeft = (
	pendingSince: string | undefined,
	now: Date = new Date(),
): number => {
	if (!pendingSince) return 0;
	const remaining = PENDING_EXPIRY_MS - (now.getTime() - new Date(pendingSince).getTime());
	return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
};

/** "2026-10-09" → "10.09" — 캡션 라벨 날짜 */
export const toCaptionDate = (dateKey: string): string => {
	const [, month, day] = dateKey.split('-');
	return `${month}.${day}`;
};

export interface PreviewInput {
	dateKey: string;
	exhibitionId: string | null;
	title: string;
	venue?: string;
	imageUri?: string;
	memo?: string;
	rating?: number;
}

/** 기록 작성 중 미리보기용 액자 — 저장 후 벽에 걸릴 모양(해시 키 동일)과 같게 만든다 */
export const buildPreviewItem = (input: PreviewInput): WallItem =>
	toWallItem(makeVisitKey(input.dateKey, input.exhibitionId, input.title), {
		exhibitionId: input.exhibitionId,
		exhibitionTitle: input.title,
		venue: input.venue,
		thumbnail: input.imageUri,
		memo: input.memo,
		rating: input.rating,
		listened: [],
		status: 'confirmed',
	});
