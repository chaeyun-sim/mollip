import { KCISA_INSTITUTION_INFO } from '@/src/constants/kcisaInstitutions';
import { stripHtml } from '@/src/utils/stripHtml';
import type { Exhibition } from '@/src/data/exhibitions';

// kcisa_exhibitions 테이블 조회 시 공통으로 쓰는 컬럼 목록 (여러 훅/유틸에서 재사용).
// useKcisaExhibitionDetail.ts와 findRelatedExhibitions.ts가 서로를 import하면서 생기던
// require cycle을 없애기 위해 공용 매핑 로직을 별도 파일로 분리했다.
export const KCISA_EXHIBITION_COLUMNS =
	'id, title, institution, event_site, genre, description, image_url, url, author, contact_point, charge, period, event_period';

export interface KcisaRow {
	id: string;
	title: string;
	institution: string | null;
	event_site: string | null;
	genre: string | null;
	description: string | null;
	image_url: string | null;
	url: string | null;
	author: string | null;
	contact_point: string | null;
	charge: string | null;
	period: string | null;
	event_period: string | null;
}

function formatPeriodPart(part: string | undefined): string {
	if (!part) return '';
	return part.trim().replace(/-/g, '.');
}

function splitPeriod(period: string | null): { startDate: string; endDate: string } {
	const [start, end] = (period ?? '').split('~');
	return { startDate: formatPeriodPart(start), endDate: formatPeriodPart(end) };
}

export function mapKcisaRowToExhibition(row: KcisaRow): Exhibition {
	const { startDate, endDate } = splitPeriod(row.period);
	const charge = row.charge?.trim() ?? '';
	// KCISA API는 전화번호/주소를 거의 안 줌 — 알려진 기관 대표 정보로 보강한다.
	const institutionInfo = row.institution ? KCISA_INSTITUTION_INFO[row.institution] : undefined;
	return {
		id: row.id,
		title: row.title,
		venue: [row.institution, row.event_site].filter(Boolean).join(' ') || '장소 정보 없음',
		venueAddress: institutionInfo?.address,
		startDate,
		endDate,
		artist: row.author || undefined,
		description: row.description ? stripHtml(row.description) : '',
		posterColor: '#E8E4DC',
		genre: row.genre?.trim() || '전시',
		heroImageUri: row.image_url || undefined,
		openHours: row.event_period || '운영시간 정보 없음',
		admission: charge || '정보 없음',
		admissionFree: charge === '0' || charge.includes('무료'),
		ticketUrl: row.url || undefined,
		phone: row.contact_point || institutionInfo?.phone,
		artworks: [],
		relatedExhibitionIds: [],
		tags: row.genre ? [row.genre] : undefined,
	};
}
