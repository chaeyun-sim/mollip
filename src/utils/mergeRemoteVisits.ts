import type { DayVisit, ListenedItem, RemoteVisitPatch } from '@/src/store/visitStore';
import type { Json } from '@/src/types/database.types';
import { localVisitKeyFromRemote } from '@/src/utils/visitKey';
import type { Companion } from '@/src/utils/visitRecord';

/** useVisitSync가 받아오는 visits 행 */
export interface RemoteVisitRow {
	visit_key: string;
	date: string;
	exhibition_id: number | null;
	memo: string | null;
	exhibition_title: string | null;
	venue: string | null;
	ticket_photo_url: string | null;
	venue_photo_urls: string[] | null;
	visit_status: string;
	visit_started_at: string | null;
	visit_ended_at: string | null;
	rating: number | null;
	listened: Json;
	signature_svg: string | null;
	companion: string | null;
	keywords: string[] | null;
	is_revisit: boolean | null;
	pending_since: string | null;
	deleted_at: string | null;
}

export interface MergedVisits {
	/** 화면·로컬 DB에 반영할 기록 */
	visits: Record<string, DayVisit>;
	/** 다른 기기에서 지운 기록 — 이 기기의 로컬 DB에서도 지운다 */
	deletedKeys: string[];
	/** 서버로 다시 올리거나 비어 있는 컬럼을 채울 값 */
	uploads: { key: string; patch: RemoteVisitPatch }[];
}

/** 기기에만 있던 필드를 서버 컬럼 형식으로 바꾼다 */
export const toRemoteVisitFields = (visit: DayVisit): RemoteVisitPatch => ({
	rating: visit.rating ?? null,
	listened: visit.listened,
	signature_svg: visit.signatureSvg ?? null,
	companion: visit.companion ?? null,
	keywords: visit.keywords ?? null,
	is_revisit: visit.isRevisit ?? null,
});

const parseListened = (value: Json): ListenedItem[] => {
	if (!Array.isArray(value)) return [];
	return value.filter(
		(item): item is ListenedItem & Json =>
			typeof item === 'object' &&
			item !== null &&
			!Array.isArray(item) &&
			typeof item.title === 'string',
	) as ListenedItem[];
};

/** 서버 목록을 기준으로, 기기에서만 들은 작품을 뒤에 이어 붙인다 */
const unionListened = (remote: ListenedItem[], local: ListenedItem[] = []): ListenedItem[] => {
	const titles = new Set(remote.map((item) => item.title));
	return [...remote, ...local.filter((item) => !titles.has(item.title))];
};

const resolveStatus = (row: RemoteVisitRow, local?: DayVisit): DayVisit['status'] => {
	// 다른 기기에서 확정했으면 이 기기의 미확정 상태보다 우선한다
	if (row.visit_status === 'confirmed') return 'confirmed';
	if (local?.status) return local.status;
	if (row.visit_status === 'ended') return 'pending';
	return row.ticket_photo_url ? 'confirmed' : undefined;
};

/** 서버 값이 비어 있는데 기기에만 값이 있으면, 그 값을 올릴 patch로 모은다 (기존 데이터 이관) */
const collectBackfill = (
	row: RemoteVisitRow,
	local: DayVisit,
	listened: ListenedItem[],
	remoteListenedCount: number,
): RemoteVisitPatch => {
	const patch: RemoteVisitPatch = {};
	if (row.rating === null && local.rating !== undefined) patch.rating = local.rating;
	if (listened.length > remoteListenedCount) patch.listened = listened;
	if (row.signature_svg === null && local.signatureSvg !== undefined) {
		patch.signature_svg = local.signatureSvg;
	}
	if (row.companion === null && local.companion !== undefined) patch.companion = local.companion;
	if (row.keywords === null && local.keywords !== undefined) patch.keywords = local.keywords;
	if (row.is_revisit === null && local.isRevisit !== undefined) patch.is_revisit = local.isRevisit;
	return patch;
};

/**
 * 서버 visits와 기기 기록을 합친다.
 * - 삭제 표시된 서버 행은 기기에서도 지우고, 다시 올리지 않는다.
 * - 서버 값이 우선이고, 서버가 비어 있는 필드만 기기 값으로 채운 뒤 서버에도 올린다.
 * - 서버에 없는 확정 기록은 같은 날 덮여 빠진 것으로 보고 다시 올린다.
 */
export const mergeRemoteVisits = (
	rows: RemoteVisitRow[],
	localVisits: Record<string, DayVisit>,
): MergedVisits => {
	const visits: Record<string, DayVisit> = {};
	const deletedKeys: string[] = [];
	const uploads: MergedVisits['uploads'] = [];

	for (const row of rows) {
		const key = localVisitKeyFromRemote(row.date, row.visit_key);
		if (row.deleted_at) {
			deletedKeys.push(key);
			continue;
		}

		const local = localVisits[key];
		const remoteListened = parseListened(row.listened);
		const listened = unionListened(remoteListened, local?.listened);
		const status = resolveStatus(row, local);
		const visitedAt =
			row.visit_started_at && row.visit_ended_at
				? { start: row.visit_started_at, end: row.visit_ended_at }
				: undefined;

		visits[key] = {
			exhibitionId: row.exhibition_id ? String(row.exhibition_id) : null,
			listened,
			memo: row.memo ?? undefined,
			exhibitionTitle: local?.exhibitionTitle ?? row.exhibition_title ?? undefined,
			venue: local?.venue ?? row.venue ?? undefined,
			thumbnail: row.ticket_photo_url ?? undefined,
			venuePhotos:
				row.venue_photo_urls && row.venue_photo_urls.length > 0 ? row.venue_photo_urls : undefined,
			status,
			pendingSince:
				status === 'confirmed'
					? undefined
					: (local?.pendingSince ?? row.pending_since ?? undefined),
			signatureSvg: row.signature_svg ?? local?.signatureSvg,
			visitedAt: local?.visitedAt ?? visitedAt,
			rating: row.rating ?? local?.rating,
			companion: (row.companion as Companion | null) ?? local?.companion,
			keywords: row.keywords ?? local?.keywords,
			isRevisit: row.is_revisit ?? local?.isRevisit,
		};

		if (local) {
			const patch = collectBackfill(row, local, listened, remoteListened.length);
			if (Object.keys(patch).length > 0) uploads.push({ key, patch });
		}
	}

	const deleted = new Set(deletedKeys);
	// 진행 중·미확정은 아직 서버에 확정 전이라 기기에 남긴다.
	// 그 외 서버에 없는 기록은 다른 기기에서 지운 것 — 다시 올리면 되살아나므로 기기에서도 지운다.
	for (const [key, local] of Object.entries(localVisits)) {
		if (visits[key] || deleted.has(key)) continue;
		if (local.status === 'pending' || local.status === 'in_progress') {
			visits[key] = { ...local, thumbnail: undefined, venuePhotos: undefined, memo: undefined };
			continue;
		}
		deletedKeys.push(key);
	}

	return { visits, deletedKeys, uploads };
};
