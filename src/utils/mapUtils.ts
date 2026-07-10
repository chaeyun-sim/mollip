import type { Exhibition } from '../data/exhibitions';
import type { VenueGroup } from '../data/venues';

export type Cluster = {
	venues: VenueGroup[];
	latitude: number;
	longitude: number;
};

const CLUSTER_RADIUS_PX = 40;

/** 현재 줌 레벨 기준으로 마커를 클러스터로 그룹화 */
export function computeClusters(venues: VenueGroup[], zoom: number): Cluster[] {
	const radius = latOffsetForPixels(zoom, CLUSTER_RADIUS_PX);
	const clusters: Cluster[] = [];
	const assigned = new Set<string>();

	for (const v of venues) {
		if (assigned.has(v.venueName)) continue;

		const members = venues.filter(
			(u) =>
				!assigned.has(u.venueName) &&
				Math.abs(u.coordinates.latitude - v.coordinates.latitude) <= radius &&
				Math.abs(u.coordinates.longitude - v.coordinates.longitude) <= radius * 1.5,
		);
		members.forEach((u) => assigned.add(u.venueName));

		const lat = members.reduce((s, u) => s + u.coordinates.latitude, 0) / members.length;
		const lon = members.reduce((s, u) => s + u.coordinates.longitude, 0) / members.length;
		clusters.push({ venues: members, latitude: lat, longitude: lon });
	}

	return clusters;
}

/** "10:00 – 20:00" 형태 파싱 후 지정 날짜 영업 중 여부 */
export function isOpenOn(openHours: string, date: Date): boolean {
	const match = openHours.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
	if (!match) return false;
	// 오늘이 아닌 날짜는 영업시간만 있으면 "영업 중"으로 처리
	if (new Date().toDateString() !== date.toDateString()) return true;
	const cur = date.getHours() * 60 + date.getMinutes();
	const open = parseInt(match[1]) * 60 + parseInt(match[2]);
	const close = parseInt(match[3]) * 60 + parseInt(match[4]);
	return cur >= open && cur < close;
}

/** "2026.05.01" 형태 파싱 */
export function parseDate(s: string): Date {
	const [y, m, d] = s.split('.').map(Number);
	return new Date(y, m - 1, d);
}

/** 지정 날짜에 전시 중인 항목이 하나라도 있는지 */
export function hasExhibitionOn(exhibitions: Exhibition[], date: Date): boolean {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return exhibitions.some((ex) => {
		const start = parseDate(ex.startDate);
		const end = parseDate(ex.endDate);
		end.setHours(23, 59, 59, 999);
		return d >= start && d <= end;
	});
}

/** Haversine 직선거리 (km) */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 줌 레벨 기준 위도 오프셋 (픽셀 → 도) */
export function latOffsetForPixels(zoom: number, pixels: number): number {
	const metersPerPx = 156543.03392 / Math.pow(2, zoom);
	return (metersPerPx * pixels) / 111320;
}

/** km 거리를 표시 문자열로 변환 */
export function formatDistance(km: number): string {
	return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
