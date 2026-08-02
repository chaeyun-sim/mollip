import { KCISA_INSTITUTION_INFO } from '@/src/constants/kcisaInstitutions';
import { stripHtml } from '@/src/utils/stripHtml';
import { displayGenre, sanitizeExhibitionTags } from '@/src/utils/exhibitionClassification';
import type { Exhibition } from '@/src/data/exhibitions';

// live Supabase exhibitions 컬럼 (2026-08 기준)
export const EXHIBITION_COLUMNS =
	'id, source, museum_id, venue_name_fallback, event_site, title, start_date, end_date, artist, description, image_url, genre, type, tags, open_hours, closed_days, admission, ticket_url, web_site';

export interface ExhibitionRow {
	id: number;
	source: 'kcisa' | 'culture' | 'manual';
	museum_id: number | null;
	venue_name_fallback: string;
	event_site: string | null;
	title: string;
	start_date: string;
	end_date: string;
	artist: string | null;
	description: string | null;
	image_url: string | null;
	genre: string | null;
	type: string | null;
	tags: string[] | null;
	open_hours: string | null;
	closed_days: string | null;
	admission: string | null;
	ticket_url: string | null;
	web_site: string | null;
}

export interface MuseumJoinRow {
	name: string;
	address: string | null;
	phone: string | null;
	homepage_url: string | null;
	open_hours: string | null;
	rstdeInfo: string | null;
}

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

export function mapExhibitionRowToExhibition(
	row: ExhibitionRow,
	museum?: MuseumJoinRow | null,
): Exhibition {
	const museumName = museum?.name?.trim();
	const venueName =
		museumName ||
		[row.venue_name_fallback, row.event_site].filter(Boolean).join(' ').trim();
	const institutionInfo =
		row.source === 'kcisa' ? KCISA_INSTITUTION_INFO[row.venue_name_fallback] : undefined;
	const admission = row.admission?.trim() || '정보 없음';
	const openHours =
		row.open_hours?.trim() ||
		museum?.open_hours?.trim() ||
		'운영시간 정보 없음';
	const closedDays = row.closed_days?.trim() || museum?.rstdeInfo?.trim() || undefined;
	return {
		id: String(row.id),
		title: row.title,
		venue: venueName || '장소 정보 없음',
		venueAddress: museum?.address?.trim() || institutionInfo?.address,
		startDate: row.start_date,
		endDate: row.end_date,
		artist: row.artist || undefined,
		description: row.description ? stripHtml(row.description) : '',
		posterColor: '#E8E4DC',
		genre: displayGenre(row.genre) ?? '',
		exhibitionType: row.type?.trim() || undefined,
		tags: sanitizeExhibitionTags(normalizeTags(row.tags as string[] | string | null)),
		heroImageUri: row.image_url?.trim() || undefined,
		openHours,
		closedDays,
		admission,
		admissionFree: isAdmissionFree(admission),
		ticketUrl: row.ticket_url || row.web_site || undefined,
		phone: museum?.phone?.trim() || institutionInfo?.phone,
		artworks: [],
		relatedExhibitionIds: [],
	};
}
