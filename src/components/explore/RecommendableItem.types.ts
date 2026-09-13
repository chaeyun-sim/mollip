import type { ExhibitionStatus } from '@/src/utils/exhibitionSearch';

export interface RecommendableItem {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
	/** Supabase `start_date` (YYYY.MM.DD), 썸네일 표시 불가 시 대체 정보로 사용 */
	startDate?: string | null;
	endDate?: string | null;
}
