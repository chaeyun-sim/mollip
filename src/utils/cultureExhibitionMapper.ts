import type { Exhibition } from '@/src/data/exhibitions';

export function formatDate(raw: string): string {
	if (raw.length !== 8) return raw;
	return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

function parseCoordinate(raw: string | undefined): number | undefined {
	const n = raw ? Number(raw) : NaN;
	return Number.isFinite(n) ? n : undefined;
}

export function mapCultureItemToExhibition(item: {
	seq: string;
	title: string;
	place: string;
	placeAddr: string;
	startDate: string;
	endDate: string;
	contents1: string;
	price: string;
	url: string;
	phone: string;
	imgUrl: string;
	gpsX?: string;
	gpsY?: string;
}): Exhibition {
	const longitude = parseCoordinate(item.gpsX);
	const latitude = parseCoordinate(item.gpsY);
	return {
		id: item.seq,
		title: item.title,
		venue: item.place,
		venueAddress: item.placeAddr || undefined,
		startDate: formatDate(item.startDate),
		endDate: formatDate(item.endDate),
		// contents1(설명)은 문화포털 데이터 자체에 거의 항상 비어있음 — 빈 문자열로 두고
		// 화면에서 없을 때 안내 URL 링크로 대체하도록 한다.
		description: item.contents1,
		posterColor: '#E8E4DC',
		genre: '전시',
		heroImageUri: item.imgUrl || undefined,
		openHours: '운영시간 정보 없음',
		admission: item.price || '정보 없음',
		admissionFree: item.price?.includes('무료'),
		ticketUrl: item.url || undefined,
		phone: item.phone || undefined,
		coordinates: latitude != null && longitude != null ? { latitude, longitude } : undefined,
		artworks: [],
		relatedExhibitionIds: [],
	};
}
