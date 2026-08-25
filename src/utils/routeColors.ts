import type { RouteLeg } from '@/src/api/tmap';

export const LEG_DEFAULT_COLOR: Record<RouteLeg['mode'], string> = {
	walk: '#c8c1bc',
	bus: '#0068B7',
	subway: '#2563EB',
};

// ODsay 공식 문서의 버스노선 타입(type) 코드 — routeName 문자열 추정보다 이 값이 우선한다.
const BUS_ROUTE_TYPE_COLOR: Record<number, string> = {
	1: '#0068B7', // 일반
	2: '#0068B7', // 좌석
	3: '#53B332', // 마을버스
	4: '#0068B7', // 직행좌석
	5: '#3D5BAB', // 공항버스
	6: '#0068B7', // 간선급행
	10: '#53B332', // 외곽
	11: '#0068B7', // 간선
	12: '#53B332', // 지선
	13: '#F2B70A', // 순환
	14: '#E60012', // 광역
	15: '#E60012', // 급행
	16: '#5112AB', // 관광버스
	20: '#53B332', // 농어촌버스
	22: '#E60012', // 경기도 시외형버스
	26: '#0068B7', // 급행간선
	30: '#0068B7', // 한강버스
};

// 자릿수 기반 추정 — routeType이 없을 때만 쓰는 폴백.
function busColorFromNumber(routeName?: string): string {
	const busNo = routeName?.split(':').pop() ?? '';
	if (!busNo) return BUS_ROUTE_TYPE_COLOR[11];
	if (/[가-힣]/.test(busNo)) return BUS_ROUTE_TYPE_COLOR[3];

	const digits = busNo.replace(/\D/g, '');
	if (digits.length === 4)
		return digits.startsWith('9') ? BUS_ROUTE_TYPE_COLOR[14] : BUS_ROUTE_TYPE_COLOR[12];
	if (digits.length === 3) return BUS_ROUTE_TYPE_COLOR[11];
	return BUS_ROUTE_TYPE_COLOR[11];
}

function busColor(leg: RouteLeg): string {
	if (leg.routeType != null && BUS_ROUTE_TYPE_COLOR[leg.routeType] != null) {
		return BUS_ROUTE_TYPE_COLOR[leg.routeType];
	}
	return busColorFromNumber(leg.routeName);
}

// ODsay 공식 문서의 지하철 노선 타입(type) 코드 — 노선명 문자열보다 이 값이 우선한다.
const SUBWAY_TYPE_COLOR: Record<number, string> = {
	1: '#0052A4', // 수도권 1호선
	2: '#00A84D', // 수도권 2호선
	3: '#EF7C1C', // 수도권 3호선
	4: '#00A5DE', // 수도권 4호선
	5: '#996CAC', // 수도권 5호선
	6: '#CD7C2F', // 수도권 6호선
	7: '#747F00', // 수도권 7호선
	8: '#E6186C', // 수도권 8호선
	9: '#BDB092', // 수도권 9호선
	91: '#9A6292', // GTX-A
	101: '#0090D2', // 공항철도
	102: '#8FA0B3', // 자기부상철도
	104: '#77C4A3', // 경의중앙선
	107: '#509F22', // 에버라인
	108: '#0C8E72', // 경춘선
	109: '#D4003B', // 신분당선
	110: '#FDA600', // 의정부경전철
	112: '#003DA5', // 경강선
	113: '#B0CE3D', // 우이신설선
	114: '#81A914', // 서해선
	115: '#AD8600', // 김포골드라인
	116: '#F5A200', // 수인분당선
	117: '#6FB1E1', // 신림선
	21: '#7CA8D5', // 인천 1호선
	22: '#ED8B00', // 인천 2호선
	31: '#007448', // 대전 1호선
	41: '#D93F5C', // 대구 1호선
	42: '#00AA80', // 대구 2호선
	43: '#FFB100', // 대구 3호선
	48: '#003DA5', // 대경선
	51: '#009088', // 광주 1호선
	71: '#F06A00', // 부산 1호선
	72: '#81BF48', // 부산 2호선
	73: '#BB8C00', // 부산 3호선
	74: '#217DCB', // 부산 4호선
	78: '#003DA5', // 동해선
	79: '#8652A1', // 부산-김해경전철
};

// routeType이 없을 때만 쓰는 문자열 폴백(호선명이 노선명에 그대로 들어있는 경우 대비).
const SUBWAY_NAME_COLOR: { match: string; color: string }[] = [
	{ match: '경의중앙선', color: SUBWAY_TYPE_COLOR[104] },
	{ match: '수인분당선', color: SUBWAY_TYPE_COLOR[116] },
	{ match: '신분당선', color: SUBWAY_TYPE_COLOR[109] },
	{ match: '경춘선', color: SUBWAY_TYPE_COLOR[108] },
	{ match: '공항철도', color: SUBWAY_TYPE_COLOR[101] },
	{ match: '1호선', color: SUBWAY_TYPE_COLOR[1] },
	{ match: '2호선', color: SUBWAY_TYPE_COLOR[2] },
	{ match: '3호선', color: SUBWAY_TYPE_COLOR[3] },
	{ match: '4호선', color: SUBWAY_TYPE_COLOR[4] },
	{ match: '5호선', color: SUBWAY_TYPE_COLOR[5] },
	{ match: '6호선', color: SUBWAY_TYPE_COLOR[6] },
	{ match: '7호선', color: SUBWAY_TYPE_COLOR[7] },
	{ match: '8호선', color: SUBWAY_TYPE_COLOR[8] },
	{ match: '9호선', color: SUBWAY_TYPE_COLOR[9] },
];

function subwayColorFromName(routeName?: string): string {
	if (!routeName) return LEG_DEFAULT_COLOR.subway;
	return (
		SUBWAY_NAME_COLOR.find((line) => routeName.includes(line.match))?.color ??
		LEG_DEFAULT_COLOR.subway
	);
}

function subwayColor(leg: RouteLeg): string {
	if (leg.routeType != null && SUBWAY_TYPE_COLOR[leg.routeType] != null) {
		return SUBWAY_TYPE_COLOR[leg.routeType];
	}
	return subwayColorFromName(leg.routeName);
}

// 경로 구간(도보/버스/지하철)의 표시 색상 — 지도 경로선과 경로 카드가 같은 색을 쓴다.
export function legColor(leg: RouteLeg): string {
	if (leg.mode === 'subway') return subwayColor(leg);
	if (leg.mode === 'bus') return busColor(leg);
	return LEG_DEFAULT_COLOR.walk;
}
