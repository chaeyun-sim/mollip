import type { Exhibition } from './exhibitions';

export type VenueGroup = {
	/** museums.id — exhibitions.museum_id 조회용 */
	museumId?: number;
	venueName: string;
	venueAddress?: string;
	coordinates: { latitude: number; longitude: number };
	openHours: string;
	closedDays?: string;
	exhibitions: Exhibition[];
	phone?: string;
	homepageUrl?: string;
	description?: string;
	amenities?: string[];
};

// 지도 마커는 Supabase museums + useMapVenues(useMuseums)가 담당한다.
// 정적 venueGroups는 더 이상 쓰지 않는다.
export const venueGroups: VenueGroup[] = [];

export const venueNames = new Set<string>();
