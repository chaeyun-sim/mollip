interface Response<T> {
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

export const getCultureList = async (): Promise<
	Response<CultureListResponse>
> => {
	const response = await fetch(
		`${endpoint.realm}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=10&sortStdr=1&realmCode=D000&serviceTp=A`,
	);
	const data = await response.json();
	return data;
};

export const getCultureDetail = async (
	seq: string,
): Promise<Response<CultureDetailResponse>> => {
	const response = await fetch(
		`${endpoint.detail}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&seq=${seq}`,
	);
	const data = await response.json();
	return data;
};

export const getNowRunningCultureList = async (
	keyword: string,
): Promise<Response<NowRunningCultureListResponse>> => {
	const response = await fetch(
		`${endpoint.livelihood}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=10&sortStdr=1&keyword=${keyword}`,
	);
	const data = await response.json();
	return data;
};

export const getCultureByPeriod = async (
	startDate: string,
	endDate: string,
): Promise<Response<CultureListResponse>> => {
	const response = await fetch(
		`${endpoint.period}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=10&sortStdr=1&from=${startDate}&to=${endDate}&serviceTp=A`,
	);
	const data = await response.json();
	return data;
};

export const getCultureByArea = async (
	sido: string, // 시, 도
	sigungu: string, // 시, 군, 구
): Promise<Response<CultureListResponse>> => {
	const response = await fetch(
		`${endpoint.area}?serviceKey=${process.env.EXPO_PUBLIC_DATA_KEY}&PageNo=1&numOfrows=10&sortStdr=1&sido=${sido}&sigungu=${sigungu}&serviceTp=A`,
	);
	const data = await response.json();
	return data;
};
