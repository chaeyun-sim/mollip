import type { Exhibition } from '../data/exhibitions';
import type { VenueGroup } from '../data/venues';

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

const DECLUTTER_RADIUS_PX = 40;
/** 화면에 동시에 렌더링할 최대 마커 수 (full + dots 합산) — 초과분은 버린다 */
const MAX_MARKERS = 300;

/**
 * 카카오맵 스타일 마커 밀집 처리 — 클러스터처럼 좌표를 평균 내 옮기지 않고, 각 장소는
 * 항상 자기 실제 좌표에 그대로 둔 채 "라벨 있는 큰 마커"로 보여줄지 "작은 점"으로
 * 줄일지만 정한다. 선택된 장소는 항상 큰 마커, 그다음은 오늘 진행 중인 전시가 있는
 * 장소를 우선 큰 마커로 남기고, 이미 자리 잡은 큰 마커와 너무 가까운 나머지는 점으로 줄인다.
 */
export function declutterMarkers(
	venues: VenueGroup[],
	zoom: number,
	selectedVenueName: string | null,
	referenceDate: Date,
	// 길찾기 중인 목적지 — 경로 조회를 시작하면 정보 바텀시트가 닫히며 selectedVenueName이
	// 지워지므로, 별도로 보호해 줌아웃해도 점으로 줄어들지 않게 한다.
	pinnedVenueName: string | null = null,
): { full: VenueGroup[]; dots: VenueGroup[] } {
	const radius = latOffsetForPixels(zoom, DECLUTTER_RADIUS_PX);
	const isPinned = (v: VenueGroup) =>
		v.venueName === selectedVenueName || v.venueName === pinnedVenueName;

	const priority = (v: VenueGroup) => {
		if (isPinned(v)) return 0;
		if (hasExhibitionOn(v.exhibitions, referenceDate)) return 1;
		return 2;
	};

	const sorted = [...venues].sort((a, b) => priority(a) - priority(b));

	const full: VenueGroup[] = [];
	const dots: VenueGroup[] = [];

	for (const v of sorted) {
		if (full.length + dots.length >= MAX_MARKERS && !isPinned(v)) break;

		const isSelected = isPinned(v);
		const tooCloseToFullMarker = full.some(
			(u) =>
				Math.abs(u.coordinates.latitude - v.coordinates.latitude) <= radius &&
				Math.abs(u.coordinates.longitude - v.coordinates.longitude) <= radius * 1.5,
		);
		if (isSelected || !tooCloseToFullMarker) {
			full.push(v);
		} else {
			dots.push(v);
		}
	}

	return { full, dots };
}
