import { useRecentEndpoints, type RecentLocation } from '@/src/hooks/useRecentEndpoints';

export type { RecentLocation };

const STORAGE_KEY = 'recent_locations_v1';

/** 지도 검색바("최근 방문한 곳") 전용 — 길찾기 출발지/도착지 기록과는 별개의 목록이다. */
export function useRecentLocations() {
	return useRecentEndpoints(STORAGE_KEY);
}
