import { XMLParser } from 'fast-xml-parser';

export interface Response<T> {
	header: {
		resultCode: string;
		resultMsg: string;
	};
	body: {
		items: { item: T }[];
		totalCount: string;
		PageNo: string;
		numOfrows: string;
	};
}

// 문화포털 API는 type=json 파라미터를 지원하지 않고 항상 XML을 반환한다.
// parseTagValue: false — 모든 태그를 string으로 유지 (숫자 자동 변환 방지, seq/날짜 필드가
// 타입 선언(string)과 실제로도 일치하도록 보장)
const xmlParser = new XMLParser({ isArray: (name) => name === 'item', parseTagValue: false });

async function parseXmlResponse<T>(res: globalThis.Response): Promise<Response<T>> {
	const xml = await res.text();
	const parsed = xmlParser.parse(xml)?.response ?? {};
	const header = parsed.header ?? {};
	const body = parsed.body ?? {};
	const items: T[] = body.items?.item ?? [];
	return {
		header: {
			resultCode: String(header.resultCode ?? ''),
			resultMsg: String(header.resultMsg ?? ''),
		},
		body: {
			items: items.map((item) => ({ item })),
			totalCount: String(body.totalCount ?? '0'),
			PageNo: String(body.PageNo ?? '1'),
			numOfrows: String(body.numOfrows ?? '0'),
		},
	};
}

interface CultureListResponse {
	gpsY: string;
	serviceName: string;
	seq: string;
	title: string;
	startDate: string;
	endDate: string;
	place: string;
	realmName: string;
	area: string;
	thumbnail: string;
	gpsX: string;
	sigungu: string;
}

interface CultureDetailResponse extends Omit<CultureListResponse, 'serviceName' | 'thumbNail'> {
	price: string;
	contents1: string;
	url: string;
	phone: string;
	imgUrl: string;
	placeUrl: string;
	placeAddr: string;
	placeSeq: string;
}

const DATA_URL = 'https://apis.data.go.kr/B553457/cultureinfo';

/** period2 조회 종료일 — 상설·먼 종료일까지 기간 겹침 조회 */
const CULTURE_EXHIBITION_PERIOD_TO = '29991231';

function isCultureExhibitionItem(item: CultureListResponse): boolean {
	return item.serviceName === '전시';
}

const endpoint = {
	detail: `${DATA_URL}/detail2`,
	period: `${DATA_URL}/period2`,
	area: `${DATA_URL}/area2`,
};

/** period2 요청당 row 수 — API가 허용하면 한 번에 많이 받음 (totalCount가 더 크면 PageNo로 이어 받음) */
const CULTURE_PERIOD_PAGE_SIZE = 1000;

async function fetchCulturePeriodPage(pageNo: number): Promise<Response<CultureListResponse>> {
	const response = await fetch(
		`${endpoint.period}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=${pageNo}&numOfrows=${CULTURE_PERIOD_PAGE_SIZE}&sortStdr=1&from=20200101&to=${CULTURE_EXHIBITION_PERIOD_TO}&serviceTp=A`,
	);
	return parseXmlResponse<CultureListResponse>(response);
}

/** 홈·culture 캐시용 — period2 페이지네이션 + serviceName=전시 */
export const getCultureExhibitionList = async (
	numOfrows = 30,
): Promise<Response<CultureListResponse>> => {
	const seenSeq = new Set<string>();
	const exhibitions: CultureListResponse[] = [];
	let totalCount = '0';
	let lastHeader = { resultCode: '00', resultMsg: 'OK' };

	for (let page = 1; page <= 20; page++) {
		const parsed = await fetchCulturePeriodPage(page);
		lastHeader = parsed.header;
		totalCount = parsed.body.totalCount;
		const pageExhibitions = parsed.body.items
			.map(({ item }) => item)
			.filter(isCultureExhibitionItem)
			.filter((item) => {
				if (seenSeq.has(item.seq)) return false;
				seenSeq.add(item.seq);
				return true;
			});
		exhibitions.push(...pageExhibitions);
		if (exhibitions.length >= numOfrows) break;
		if (parsed.body.items.length < CULTURE_PERIOD_PAGE_SIZE) break;
		const total = Number(totalCount);
		if (Number.isFinite(total) && page * CULTURE_PERIOD_PAGE_SIZE >= total) break;
	}

	const slice = exhibitions.slice(0, numOfrows);
	return {
		header: lastHeader,
		body: {
			items: slice.map((item) => ({ item })),
			totalCount: String(exhibitions.length),
			PageNo: '1',
			numOfrows: String(slice.length),
		},
	};
};

export const getCultureDetail = async (seq: string): Promise<Response<CultureDetailResponse>> => {
	const response = await fetch(
		`${endpoint.detail}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&seq=${seq}`,
	);
	return parseXmlResponse<CultureDetailResponse>(response);
};

export const getCultureByArea = async (
	sido: string, // 시, 도
	sigungu: string, // 시, 군, 구
): Promise<Response<CultureListResponse>> => {
	// area2는 realmCode 파라미터를 무시하고 무용/뮤지컬/연극/행사 등 모든 장르를 섞어서
	// 준다 — 서버가 필터링을 안 해주므로 realmName으로 클라이언트에서 직접 걸러낸다.
	const response = await fetch(
		`${endpoint.area}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=50&sortStdr=1&sido=${sido}&sigungu=${sigungu}&realmCode=D000&serviceTp=A`,
	);
	const result = await parseXmlResponse<CultureListResponse>(response);
	return {
		...result,
		body: {
			...result.body,
			items: result.body.items.filter(({ item }) => item.realmName === '전시'),
		},
	};
};
