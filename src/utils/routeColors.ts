import type { RouteLeg } from '@/src/api/tmap';

export const LEG_DEFAULT_COLOR: Record<RouteLeg['mode'], string> = {
  walk: '#c8c1bc',
  bus: '#0068B7',
  subway: '#2563EB',
};

// 서울 버스 공식 색상(간선/지선/광역/마을) — 번호 자릿수로 계통을 구분한다.
// 간선 3자리, 지선 4자리, 광역은 4자리이면서 9로 시작, 마을버스는 "구이름+숫자" 형태.
const SEOUL_BUS_COLOR = {
  광역: '#E60012',
  간선: '#0068B7',
  지선: '#53B332',
  마을: '#53B332',
} as const;

function busColor(routeName?: string): string {
  const busNo = routeName?.split(':').pop() ?? '';
  if (!busNo) return SEOUL_BUS_COLOR.간선;
  if (/[가-힣]/.test(busNo)) return SEOUL_BUS_COLOR.마을;

  const digits = busNo.replace(/\D/g, '');
  if (digits.length === 4) return digits.startsWith('9') ? SEOUL_BUS_COLOR.광역 : SEOUL_BUS_COLOR.지선;
  if (digits.length === 3) return SEOUL_BUS_COLOR.간선;
  return SEOUL_BUS_COLOR.간선;
}

// 지하철 호선별 색상 — 노선명에 포함된 문자열로 매칭한다. 더 구체적인 노선명을 앞에 두어
// "공항철도 직통"이 일반 "공항철도"보다 먼저 매칭되게 한다.
const SUBWAY_LINE_COLOR: Array<{ match: string; color: string }> = [
  { match: '경의중앙선', color: '#77C4A3' },
  { match: '수인분당선', color: '#F5A200' },
  { match: '경강선', color: '#003DA5' },
  { match: '동해선', color: '#003DA5' },
  { match: '대경선', color: '#003DA5' },
  { match: '경춘선', color: '#0C8E72' },
  { match: '신분당선', color: '#D4003B' },
  { match: '의정부경전철', color: '#FDA600' },
  { match: '용인경전철', color: '#509F22' },
  { match: '서해선', color: '#81A914' },
  { match: '신안산선', color: '#F04938' },
  { match: '직통', color: '#F97600' },
  { match: '공항철도', color: '#0090D2' },
  { match: '1호선', color: '#0052A4' },
  { match: '2호선', color: '#00A84D' },
  { match: '3호선', color: '#EF7C1C' },
  { match: '4호선', color: '#00A5DE' },
  { match: '5호선', color: '#996CAC' },
  { match: '6호선', color: '#CD7C2F' },
  { match: '7호선', color: '#747F00' },
  { match: '8호선', color: '#E6186C' },
  { match: '9호선', color: '#BDB092' },
];

function subwayLineColor(routeName?: string): string {
  if (!routeName) return LEG_DEFAULT_COLOR.subway;
  return SUBWAY_LINE_COLOR.find((line) => routeName.includes(line.match))?.color ?? LEG_DEFAULT_COLOR.subway;
}

// 경로 구간(도보/버스/지하철)의 표시 색상 — 지도 경로선과 경로 카드가 같은 색을 쓴다.
export function legColor(leg: RouteLeg): string {
  if (leg.mode === 'subway') return subwayLineColor(leg.routeName);
  if (leg.mode === 'bus') return busColor(leg.routeName);
  return LEG_DEFAULT_COLOR.walk;
}
