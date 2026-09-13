import { Ionicons } from '@expo/vector-icons';
import { LinearTransition } from 'react-native-reanimated';

import type { RouteCoord, RouteLeg, RouteResult } from '@/src/api/tmap';
import type { DirectionsMode } from '@/src/hooks/useDirections';
import { legColor } from '@/src/utils/routeColors';

// Apple "Designing Fluid Interfaces" 기준 — 기본 UI는 오버슈트 없이 부드럽게 안착시키고(임계 감쇠),
// 손가락 힘이 실린 동작(카드 누름)에만 아주 약한 바운스를 허용한다.
export const SPRING_SETTLE = { damping: 28, stiffness: 220, mass: 0.9 } as const;
export const SPRING_PRESS = { damping: 18, stiffness: 320, mass: 0.7 } as const;

// 정렬 변경으로 카드 순서가 바뀔 때 쓰는 레이아웃 스프링 — 과감쇠로 두어 오버슈트 없이 딱 멈춘다.
export const CARD_LAYOUT = LinearTransition.springify().damping(32).stiffness(200).mass(0.9);

export const LEG_ICON: Record<RouteLeg['mode'], keyof typeof Ionicons.glyphMap> = {
	walk: 'walk',
	bus: 'bus',
	subway: 'train',
};

// 구간 바 너비 계산 기준 — 구간 비중(flex)에 이 값을 곱해 픽셀 너비를 만든다.
// 구간이 많아 합산 너비가 카드 폭을 넘으면 가로 스크롤로 넘어간다.
export const BAR_WIDTH_SCALE = 220;

export function formatMinutes(seconds: number): string {
	const total = Math.max(1, Math.round(seconds / 60));
	if (total < 60) return `${total}분`;
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${h}시간 ${String(m).padStart(2, '0')}분`;
}

export function formatDistanceM(meters: number): string {
	return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

// ODsay 공식 버스노선 타입 코드 — 14 = 광역버스.
const BUS_ROUTE_TYPE_EXPRESS = 14;

// Tmap 노선명이 "지선:3011"처럼 "구분:번호" 형태로 와서, 번호만 남긴다.
// 광역버스는 일반버스보다 요금이 비싼데 번호만 봐서는 구분이 안 돼서, 앞에 "M"을 붙여 표시한다.
export function busNumber(leg: RouteLeg): string {
	const raw = leg.routeName?.split(':').pop() ?? '';
	if (!raw) return raw;
	if (leg.routeType === BUS_ROUTE_TYPE_EXPRESS && !raw.toUpperCase().startsWith('M')) {
		return `M${raw}`;
	}
	return raw;
}

export type SortCriterion = 'time' | 'distance' | 'transfer' | 'fare' | 'walk';

export const SORT_OPTIONS: { key: SortCriterion; label: string }[] = [
	{ key: 'time', label: '최단 시간' },
	{ key: 'distance', label: '최단 거리' },
	{ key: 'transfer', label: '환승 적은 순' },
	{ key: 'fare', label: '최소 운임 순' },
	{ key: 'walk', label: '최소 도보 순' },
];

// 경로 전체 구간 중 도보 구간만 합산 — 같은 총 소요시간이라도 걷는 시간이 다를 수 있다.
function walkSeconds(route: RouteResult): number {
	return route.legs
		.filter((leg) => leg.mode === 'walk')
		.reduce((sum, leg) => sum + leg.sectionSeconds, 0);
}

export function compareRoutes(a: RouteResult, b: RouteResult, criterion: SortCriterion): number {
	if (criterion === 'time') return a.durationSeconds - b.durationSeconds;
	if (criterion === 'distance') return a.distanceMeters - b.distanceMeters;
	if (criterion === 'transfer') return a.transferCount - b.transferCount;
	if (criterion === 'fare') return (a.fareWon ?? Infinity) - (b.fareWon ?? Infinity);
	return walkSeconds(a) - walkSeconds(b);
}

// 경로 카드 상단 요약 — key-value 형태로 미리 뽑아두고 JSX는 그대로 찍기만 한다.
export interface RouteSummaryData {
	totalTime: string;
	totalDistance: string;
	transferText?: string;
	fareText?: string;
	legBars: {
		key: string;
		icon: keyof typeof Ionicons.glyphMap;
		time: string;
		color: string;
		flex: number;
	}[];
}

export function buildSummary(route: RouteResult, mode: DirectionsMode): RouteSummaryData {
	const totalSeconds = route.legs.reduce((sum, leg) => sum + leg.sectionSeconds, 0) || 1;
	return {
		totalTime: formatMinutes(route.durationSeconds),
		totalDistance: formatDistanceM(route.distanceMeters),
		transferText:
			mode === 'bus' && route.transferCount > 0 ? `환승 ${route.transferCount}회` : undefined,
		fareText: route.fareWon != null ? `${route.fareWon.toLocaleString()}원` : undefined,
		legBars: route.legs.map((leg, i) => ({
			key: `${i}`,
			icon: LEG_ICON[leg.mode],
			time: formatMinutes(leg.sectionSeconds),
			color: legColor(leg),
			flex: Math.max(leg.sectionSeconds, 30) / totalSeconds,
		})),
	};
}

// 경로 타임라인 한 줄 — 출발/도착 지점, 도보 이동, 버스·지하철 승차/하차로 구성된다.
export type TimelineItem =
	| { type: 'endpoint'; key: string; variant: 'start' | 'end'; label: string }
	| {
			type: 'walk';
			key: string;
			routeLabel: string;
			totalTime: string;
			stopCount: number;
			length: string;
	  }
	| {
			type: 'board';
			key: string;
			color: string;
			icon: keyof typeof Ionicons.glyphMap;
			title: string;
			routeLabel: string;
			totalTime: string;
			stopCount: number;
			stopSuffix: string;
			coord: RouteCoord | null;
	  }
	| {
			type: 'alight';
			key: string;
			color: string;
			title: string;
			stopSuffix: string;
			coord: RouteCoord | null;
	  };

export function buildTimeline(
	route: RouteResult,
	destinationLabel: string,
	originLabel: string,
): TimelineItem[] {
	const items: TimelineItem[] = [
		{ type: 'endpoint', key: 'start', variant: 'start', label: originLabel },
	];

	route.legs.forEach((leg, i) => {
		if (leg.mode === 'walk') {
			items.push({
				type: 'walk',
				key: `${i}-walk`,
				routeLabel: '도보 이동',
				totalTime: formatMinutes(leg.sectionSeconds),
				stopCount: 0,
				length: formatDistanceM(leg.distanceMeters),
			});
			return;
		}

		const color = legColor(leg);
		const stopSuffix = leg.mode === 'bus' ? '정류장' : '역';
		const routeLabel = leg.mode === 'bus' ? busNumber(leg) : (leg.routeName ?? '');
		const boardCoord = leg.coords[0] ?? null;
		const alightCoord = leg.coords[leg.coords.length - 1] ?? null;

		items.push({
			type: 'board',
			key: `${i}-board`,
			color,
			icon: LEG_ICON[leg.mode],
			title: `${leg.startName}`,
			routeLabel,
			totalTime: formatMinutes(leg.sectionSeconds),
			stopCount: leg.stopCount ?? 0,
			stopSuffix,
			coord: boardCoord,
		});
		items.push({
			type: 'alight',
			key: `${i}-alight`,
			color,
			title: `${leg.endName}`,
			stopSuffix,
			coord: alightCoord,
		});
	});

	items.push({
		type: 'endpoint',
		key: 'end',
		variant: 'end',
		label: destinationLabel,
	});
	return items;
}
