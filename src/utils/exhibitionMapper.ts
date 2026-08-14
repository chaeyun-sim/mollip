import { KCISA_INSTITUTION_INFO } from '@/src/constants/kcisaInstitutions';
import { stripHtml } from '@/src/utils/stripHtml';
import {
	displayGenre,
	sanitizeExhibitionTags,
} from '@/src/utils/exhibitionClassification';
import type { Exhibition } from '@/src/data/exhibitions';
import type { Database } from '@/src/types/database.types';

// live Supabase exhibitions 컬럼 (2026-08 기준)
export const EXHIBITION_COLUMNS =
	'id, source, museum_id, venue_name_fallback, event_site, title, start_date, end_date, description, image_url, genre, type, tags, open_hours, closed_days, admission, ticket_url, web_site, note';

export type ExhibitionRow = Pick<
	Database['public']['Tables']['exhibitions']['Row'],
	| 'id' | 'source' | 'museum_id' | 'venue_name_fallback' | 'event_site'
	| 'title' | 'start_date' | 'end_date' | 'description'
	| 'image_url' | 'genre' | 'type' | 'tags' | 'open_hours' | 'closed_days'
	| 'admission' | 'ticket_url' | 'web_site' | 'note'
>;

export type MuseumJoinRow = Pick<
	Database['public']['Tables']['museums']['Row'],
	| 'name' | 'address' | 'phone' | 'homepage_url'
	| 'open_hours' | 'rstdeInfo' | 'gps_x' | 'gps_y' | 'venue_group_name'
	| 'accessibility'
>;

function isAdmissionFree(admission: string): boolean {
	const a = admission.trim();
	return a === '0' || a.includes('무료');
}

function normalizeTags(raw: string[] | string | null | undefined): string[] {
	if (raw == null) return [];
	if (Array.isArray(raw)) return raw.filter(Boolean);
	if (typeof raw === 'string') {
		const s = raw.trim();
		if (!s) return [];
		if (s.startsWith('[')) {
			try {
				const parsed = JSON.parse(s) as unknown;
				if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
			} catch {
				/* fall through */
			}
		}
		return [s];
	}
	return [];
}

// @MX:NOTE: DB 컬럼명이 직관과 반대 — gps_x = 경도(longitude), gps_y = 위도(latitude)
function parseGpsCoordinates(
	gps_x: string | null,
	gps_y: string | null,
): { latitude: number; longitude: number } | undefined {
	if (!gps_x || !gps_y) return undefined;
	const lat = parseFloat(gps_y);
	const lng = parseFloat(gps_x);
	if (isNaN(lat) || isNaN(lng)) return undefined;
	return { latitude: lat, longitude: lng };
}

export function mapExhibitionRowToExhibition(
	row: ExhibitionRow,
	museum?: MuseumJoinRow | null,
): Exhibition {
	const museumName = museum?.name?.trim();
	const venueName =
		museumName ||
		[row.venue_name_fallback, row.event_site].filter(Boolean).join(' ').trim();
	const institutionInfo =
		row.source === 'kcisa'
			? KCISA_INSTITUTION_INFO[row.venue_name_fallback]
			: undefined;
	const admission = row.admission?.trim() || '없음';
	const openHours =
		museum?.open_hours?.trim() || row.open_hours?.trim() || '운영시간 정보 없음';
	const closedDays =
		row.closed_days?.trim() || museum?.rstdeInfo?.trim() || undefined;

	return {
		id: String(row.id),
		source: row.source,
		museumId: row.museum_id,
		title: row.title,
		description: row.description ? stripHtml(row.description) : '',
		genre: displayGenre(row.genre) ?? '',
		exhibitionType: row.type?.trim() || undefined,
		tags: sanitizeExhibitionTags(
			normalizeTags(row.tags as string[] | string | null),
		),
		note: row.note?.trim() || undefined,
		venue: venueName || '장소 정보 없음',
		eventSite: row.event_site?.trim() || undefined,
		venueAddress: museum?.address?.trim() || institutionInfo?.address,
		venueGroupName: museum?.venue_group_name?.trim() || undefined,
		// artist는 DB exhibitions 테이블에 없음 — 필요 시 museums 조인 또는 별도 소스에서 주입
		coordinates: parseGpsCoordinates(museum?.gps_x ?? null, museum?.gps_y ?? null),
		startDate: row.start_date,
		endDate: row.end_date ?? '',
		openHours,
		closedDays,
		admission,
		admissionFree: isAdmissionFree(admission),
		phone: museum?.phone?.trim() || institutionInfo?.phone,
		ticketUrl: row.ticket_url || undefined,
		web_site: row.web_site || undefined,
		homepage_url: museum?.homepage_url?.trim() || undefined,
		accessibility: (museum?.accessibility as Exhibition['accessibility']) ?? undefined,
		heroImageUri: row.image_url?.trim() || undefined,
		posterColor: '#E8E4DC',
		artworks: [],
		relatedExhibitionIds: [],
	};
}
