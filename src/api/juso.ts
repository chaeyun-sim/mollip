import { jusoEntToWgs84 } from '@/src/utils/jusoCoord';

export interface JusoAddressResult {
	roadAddress: string;
	jibunAddress: string;
	latitude: number;
	longitude: number;
}

interface JusoApiRow {
	roadAddr?: string;
	jibunAddr?: string;
	entX?: string;
	entY?: string;
}

/** [행정안전부 도로명주소 검색 API](https://www.data.go.kr/data/15057017/openapi.do) */
export async function searchJusoAddresses(keyword: string): Promise<JusoAddressResult[]> {
	const q = keyword.trim();
	if (q.length < 2) return [];

	const confmKey = process.env.EXPO_PUBLIC_JUSO_CONFIRM_KEY;
	if (!confmKey) return [];

	const params = new URLSearchParams({
		confmKey,
		currentPage: '1',
		countPerPage: '8',
		keyword: q,
		resultType: 'json',
	});

	const res = await fetch(
		`https://business.juso.go.kr/addrlink/addrLinkApi.do?${params.toString()}`,
	);
	const json = (await res.json()) as {
		results?: { common?: { errorCode?: string }; juso?: JusoApiRow[] };
	};
	const rows = json.results?.juso ?? [];
	if (json.results?.common?.errorCode !== '0' && rows.length === 0) return [];

	const out: JusoAddressResult[] = [];
	for (const row of rows) {
		const road = row.roadAddr?.trim();
		if (!road || !row.entX || !row.entY) continue;
		const coord = jusoEntToWgs84(row.entX, row.entY);
		if (!coord) continue;
		out.push({
			roadAddress: road,
			jibunAddress: row.jibunAddr?.trim() ?? '',
			latitude: coord.latitude,
			longitude: coord.longitude,
		});
	}
	return out;
}
