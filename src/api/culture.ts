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

interface CultureDetailResponse extends Omit<
	CultureListResponse,
	'serviceName' | 'thumbNail'
> {
	price: string;
	contents1: string;
	url: string;
	phone: string;
	imgUrl: string;
	placeUrl: string;
	placeAddr: string;
	placeSeq: string;
}

interface NowRunningCultureListResponse extends Pick<
	CultureListResponse,
	'seq' | 'title'
> {
	orgName: string;
	regDate: string;
	url: string;
}

const DATA_URL = 'https://apis.data.go.kr/B553457/cultureinfo';

const endpoint = {
	realm: `${DATA_URL}/realm2`,
	detail: `${DATA_URL}/detail2`,
	livelihood: `${DATA_URL}/livelihood2`,
	period: `${DATA_URL}/period2`,
	area: `${DATA_URL}/area2`,
};

export const getCultureList = async (
	numOfrows = 10,
): Promise<Response<CultureListResponse>> => {
	const response = await fetch(
		`${endpoint.realm}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=${numOfrows}&sortStdr=1&realmCode=D000&serviceTp=A`,
	);
	return parseXmlResponse<CultureListResponse>(response);
};

export const getCultureDetail = async (
	seq: string,
): Promise<Response<CultureDetailResponse>> => {
	const response = await fetch(
		`${endpoint.detail}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&seq=${seq}`,
	);
	return parseXmlResponse<CultureDetailResponse>(response);
};

export const getNowRunningCultureList = async (
	keyword: string,
): Promise<Response<NowRunningCultureListResponse>> => {
	const response = await fetch(
		`${endpoint.livelihood}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=10&sortStdr=1&keyword=${keyword}`,
	);
	return parseXmlResponse<NowRunningCultureListResponse>(response);
};

export const getCultureByPeriod = async (
	startDate: string,
	endDate: string,
): Promise<Response<CultureListResponse>> => {
	const response = await fetch(
		`${endpoint.period}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=10&sortStdr=1&from=${startDate}&to=${endDate}&serviceTp=A`,
	);
	return parseXmlResponse<CultureListResponse>(response);
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
