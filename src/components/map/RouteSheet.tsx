import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
	FadeIn,
	FadeInDown,
	LinearTransition,
	interpolateColor,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RouteCoord, RouteLeg, RouteResult } from '@/src/api/tmap';
import { cn } from '@/src/lib/cn';
import type { DirectionsMode } from '@/src/hooks/useDirections';
import { legColor } from '@/src/utils/routeColors';
import { ExternalMapSheet, type ExternalMapTarget } from '@/src/components/common/ExternalMapSheet';
import { colors } from '@/src/constants/colors';

interface RouteSheetProps {
	mode: DirectionsMode;
	status: 'idle' | 'loading' | 'success' | 'error';
	route: RouteResult | null;
	routes: RouteResult[];
	selectedRouteIndex: number;
	onSelectRoute: (index: number) => void;
	onChangeMode: (mode: DirectionsMode) => void;
	// 타임라인의 승차/하차 행을 누르면 지도에서 그 좌표로 줌·이동한다.
	onFocusStop: (coord: RouteCoord) => void;
	destinationName?: string;
	originName?: string;
	bottomInset: number;
}

// Apple "Designing Fluid Interfaces" 기준 — 기본 UI는 오버슈트 없이 부드럽게 안착시키고(임계 감쇠),
// 손가락 힘이 실린 동작(카드 누름)에만 아주 약한 바운스를 허용한다.
const SPRING_SETTLE = { damping: 28, stiffness: 220, mass: 0.9 } as const;
const SPRING_PRESS = { damping: 18, stiffness: 320, mass: 0.7 } as const;

// 정렬 변경으로 카드 순서가 바뀔 때 쓰는 레이아웃 스프링 — 과감쇠로 두어 오버슈트 없이 딱 멈춘다.
const CARD_LAYOUT = LinearTransition.springify()
	.damping(32)
	.stiffness(200)
	.mass(0.9);

const LEG_ICON: Record<RouteLeg['mode'], keyof typeof Ionicons.glyphMap> = {
	walk: 'walk',
	bus: 'bus',
	subway: 'train',
};

// 구간 바 너비 계산 기준 — 구간 비중(flex)에 이 값을 곱해 픽셀 너비를 만든다.
// 구간이 많아 합산 너비가 카드 폭을 넘으면 가로 스크롤로 넘어간다.
const BAR_WIDTH_SCALE = 220;

function formatMinutes(seconds: number): string {
	const total = Math.max(1, Math.round(seconds / 60));
	if (total < 60) return `${total}분`;
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${h}시간 ${String(m).padStart(2, '0')}분`;
}

function formatDistanceM(meters: number): string {
	return meters < 1000
		? `${Math.round(meters)}m`
		: `${(meters / 1000).toFixed(1)}km`;
}

// ODsay 공식 버스노선 타입 코드 — 14 = 광역버스.
const BUS_ROUTE_TYPE_EXPRESS = 14;

// Tmap 노선명이 "지선:3011"처럼 "구분:번호" 형태로 와서, 번호만 남긴다.
// 광역버스는 일반버스보다 요금이 비싼데 번호만 봐서는 구분이 안 돼서, 앞에 "M"을 붙여 표시한다.
function busNumber(leg: RouteLeg): string {
	const raw = leg.routeName?.split(':').pop() ?? '';
	if (!raw) return raw;
	if (
		leg.routeType === BUS_ROUTE_TYPE_EXPRESS &&
		!raw.toUpperCase().startsWith('M')
	) {
		return `M${raw}`;
	}
	return raw;
}

type SortCriterion = 'time' | 'distance' | 'transfer' | 'fare' | 'walk';

const SORT_OPTIONS: Array<{ key: SortCriterion; label: string }> = [
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

function compareRoutes(
	a: RouteResult,
	b: RouteResult,
	criterion: SortCriterion,
): number {
	if (criterion === 'time') return a.durationSeconds - b.durationSeconds;
	if (criterion === 'distance') return a.distanceMeters - b.distanceMeters;
	if (criterion === 'transfer') return a.transferCount - b.transferCount;
	if (criterion === 'fare')
		return (a.fareWon ?? Infinity) - (b.fareWon ?? Infinity);
	return walkSeconds(a) - walkSeconds(b);
}

// 경로 카드 상단 요약 — key-value 형태로 미리 뽑아두고 JSX는 그대로 찍기만 한다.
interface RouteSummaryData {
	totalTime: string;
	totalDistance: string;
	transferText?: string;
	fareText?: string;
	legBars: Array<{
		key: string;
		icon: keyof typeof Ionicons.glyphMap;
		time: string;
		color: string;
		flex: number;
	}>;
}

function buildSummary(
	route: RouteResult,
	mode: DirectionsMode,
): RouteSummaryData {
	const totalSeconds =
		route.legs.reduce((sum, leg) => sum + leg.sectionSeconds, 0) || 1;
	return {
		totalTime: formatMinutes(route.durationSeconds),
		totalDistance: formatDistanceM(route.distanceMeters),
		transferText:
			mode === 'bus' && route.transferCount > 0
				? `환승 ${route.transferCount}회`
				: undefined,
		fareText:
			route.fareWon != null ? `${route.fareWon.toLocaleString()}원` : undefined,
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
type TimelineItem =
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

function buildTimeline(
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
		const routeLabel =
			leg.mode === 'bus' ? busNumber(leg) : (leg.routeName ?? '');
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

interface ModeToggleProps {
	mode: DirectionsMode;
	onChangeMode: (mode: DirectionsMode) => void;
}

const MODE_ITEMS: Array<{
	key: DirectionsMode;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}> = [
	{ key: 'walk', label: '도보', icon: 'walk' },
	{ key: 'bus', label: '대중교통', icon: 'bus' },
];

const TOGGLE_PADDING = 4;

// 도보/대중교통 전환 — 선택 알약이 손가락을 따라가듯 스프링으로 미끄러진다.
function ModeToggle({ mode, onChangeMode }: ModeToggleProps) {
	const [trackWidth, setTrackWidth] = useState(0);
	const progress = useSharedValue(mode === 'walk' ? 0 : 1);
	const pillWidth =
		trackWidth > 0 ? (trackWidth - TOGGLE_PADDING * 2) / MODE_ITEMS.length : 0;

	useEffect(() => {
		progress.value = withSpring(mode === 'walk' ? 0 : 1, SPRING_SETTLE);
	}, [mode, progress]);

	const handleLayout = useCallback((event: LayoutChangeEvent) => {
		setTrackWidth(event.nativeEvent.layout.width);
	}, []);

	const pillStyle = useAnimatedStyle(() => ({
		width: pillWidth,
		transform: [{ translateX: progress.value * pillWidth }],
	}));

	return (
		<View
			onLayout={handleLayout}
			className='w-full flex-row rounded-2xl bg-black/[0.045]'
			style={{ padding: TOGGLE_PADDING }}
		>
			{pillWidth > 0 && (
				<Animated.View
					pointerEvents='none'
					className='absolute rounded-xl bg-primary'
					style={[
						{
							top: TOGGLE_PADDING,
							left: TOGGLE_PADDING,
							bottom: TOGGLE_PADDING,
						},
						pillStyle,
					]}
				/>
			)}

			{MODE_ITEMS.map((item) => {
				const active = mode === item.key;
				return (
					<Pressable
						key={item.key}
						onPress={() => {
							if (!active) Haptics.selectionAsync();
							onChangeMode(item.key);
						}}
						className='flex-1 flex-row items-center justify-center gap-1.5 h-10'
						hitSlop={6}
						accessibilityRole='button'
						accessibilityState={{ selected: active }}
						accessibilityLabel={item.key === 'walk' ? '도보 경로' : '대중교통 경로'}
					>
						<Ionicons
							name={item.icon}
							size={15}
							className={active ? 'text-white' : 'text-stone-900/45'}
						/>
						<Text
							className={cn(
								'text-[13px] font-pretendard-bold',
								active ? 'text-white' : 'text-black/45',
							)}
						>
							{item.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

interface SortChipsProps {
	criterion: SortCriterion;
	onChangeCriterion: (criterion: SortCriterion) => void;
}

// 정렬 기준 칩 — 드롭다운 대신 항상 보이는 한 줄로 두어 선택 상태가 바로 읽힌다.
// 옵션이 늘어나 한 줄에 다 안 들어가면 가로 스크롤로 넘어간다.
function SortChips({ criterion, onChangeCriterion }: SortChipsProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ gap: 6 }}
		>
			{SORT_OPTIONS.map((option) => {
				const active = criterion === option.key;
				return (
					<Pressable
						key={option.key}
						onPress={() => {
							if (!active) Haptics.selectionAsync();
							onChangeCriterion(option.key);
						}}
						className={cn(
							'px-3 h-8 rounded-full items-center justify-center border',
							active
								? 'bg-primary border-transparent'
								: 'bg-transparent border-black/10',
						)}
						hitSlop={4}
						accessibilityRole='button'
						accessibilityState={{ selected: active }}
						accessibilityLabel={`${option.label}으로 정렬`}
					>
						<Text
							className={cn(
								'text-[12px]',
								active
									? 'text-white font-pretendard-bold'
									: 'text-black/50 font-pretendard-medium',
							)}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}

interface MetaChipProps {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
}

function MetaChip({ icon, label }: MetaChipProps) {
	return (
		<View className='flex-row items-center gap-1 px-2.5 h-[26px] rounded-full bg-black/[0.045]'>
			<Ionicons name={icon} size={11} color='rgba(28,25,23,0.5)' />
			<Text className='text-black/55 text-[11px] font-pretendard-semibold'>
				{label}
			</Text>
		</View>
	);
}

interface RouteSummaryHeaderProps {
	summary: RouteSummaryData;
	showBar: boolean;
	barDelay?: number;
}

// 경로 카드의 상단 요약 — "27분" 디스플레이 타입 + 거리·환승·요금 칩 + 구간 바
function RouteSummaryHeader({
	summary,
	showBar,
	barDelay = 0,
}: RouteSummaryHeaderProps) {
	return (
		<>
			<View className='flex-row items-baseline gap-2'>
				<Text className='text-primary text-[30px] leading-[34px] font-pretendard-bold tracking-[-0.8px]'>
					{summary.totalTime}
				</Text>
				<View className='flex flex-row items-center gap-2'>
					<Text className='text-black/40 text-[14px] font-pretendard-medium'>
						{summary.totalDistance}
					</Text>
					{summary.fareText && (
						<MetaChip icon='card-outline' label={summary.fareText} />
					)}
				</View>
			</View>

			{showBar && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					className='mt-3.5'
					contentContainerStyle={{ gap: 3 }}
				>
					{summary.legBars.map((bar, i) => (
						<Animated.View
							key={bar.key}
							entering={FadeIn.duration(260).delay(barDelay + i * 55)}
							className='items-center justify-center flex-row gap-1.5 px-2.5 h-[34px] rounded-[11px]'
							style={{
								width: Math.max(64, bar.flex * BAR_WIDTH_SCALE),
								backgroundColor: bar.color,
							}}
						>
							<Ionicons name={bar.icon} size={13} color='white' />
							<Text
								className='text-white text-[12px] font-pretendard-bold'
								numberOfLines={1}
							>
								{bar.time}
							</Text>
						</Animated.View>
					))}
				</ScrollView>
			)}
		</>
	);
}

interface RouteTimelineProps {
	route: RouteResult;
	mode: DirectionsMode;
	destinationName?: string;
	originName?: string;
	onFocusStop: (coord: RouteCoord) => void;
	onOpenExternalMap: (target: ExternalMapTarget) => void;
}

// 승차/하차/도보 상세 타임라인 — 세로 척추(스파인) 색을 구간 색에 맞춰 이어 붙인다.
// 승차/하차 행만 누를 수 있고, 누르면 카드 펼침 상태는 그대로 둔 채 지도가 그 위치로 이동한다.
function RouteTimeline({
	route,
	mode,
	destinationName,
	originName,
	onFocusStop,
	onOpenExternalMap,
}: RouteTimelineProps) {
	const items = useMemo(
		() =>
			buildTimeline(route, destinationName ?? '도착지', originName ?? '출발지'),
		[route, destinationName, originName],
	);

	return (
		<View>
			{items.map((item, i) => {
				const isLast = mode === 'walk' ? true : i === items.length - 1;
				// 승차 구간에서 이어지는 선만 노선 색을 쓰고, 나머지는 잉크 톤으로 눌러 둔다.
				const connectorColor =
					item.type === 'board' ? item.color : 'rgba(28,25,23,0.12)';

				return (
					<Animated.View
						key={item.key}
						entering={FadeInDown.duration(260).delay(i * 45)}
						className='flex-row'
					>
						<View className='items-center w-[44px]'>
							{mode === 'bus' && item.type === 'endpoint' && (
								<View
									className='w-[22px] h-[22px] rounded-full items-center justify-center'
									style={{ backgroundColor: 'rgba(28,25,23,0.08)' }}
								>
									{item.variant === 'start' ? (
										<View
											className='w-[8px] h-[8px] rounded-full bg-primary'
										/>
									) : (
										<Ionicons name='flag' size={11} className='text-primary' />
									)}
								</View>
							)}
							{item.type === 'walk' && (
								<View className='w-[22px] h-[22px] rounded-full items-center justify-center bg-black/[0.28]'>
									<Ionicons name='walk' size={12} color='white' />
								</View>
							)}
							{item.type === 'board' && (
								<View
									className='w-[26px] h-[26px] rounded-full items-center justify-center'
									style={{ backgroundColor: item.color }}
								>
									<Ionicons name={mode} size={15} color='white' />
								</View>
							)}
							{item.type === 'alight' && (
								<View
									className='w-[26px] h-[26px] rounded-full items-center justify-center bg-white border-[1.5px]'
									style={{ borderColor: item.color }}
								>
									<Text
										className='text-[10px] font-pretendard-bold'
										style={{ color: item.color }}
									>
										하차
									</Text>
								</View>
							)}
							{!isLast && (
								<View
									className='w-[2px] rounded-full mt-1 mb-1 flex-1 min-h-[26px] opacity-55'
									style={{ backgroundColor: connectorColor }}
								/>
							)}
						</View>

						{(() => {
							const content = (
								<>
									{mode === 'bus' && item.type === 'endpoint' && (
										<Text className='text-primary text-[14px] font-pretendard-bold pt-0.5'>
											{item.label}
										</Text>
									)}
									{item.type === 'walk' && (
										<View className='gap-1'>
											<Text className='text-primary text-[14px] font-pretendard-medium'>
												{item.routeLabel}
											</Text>
											<Text className='text-black/45 text-[12px] font-pretendard-regular'>
												{item.totalTime}, {item.length}
											</Text>
										</View>
									)}
									{item.type === 'board' && (
										<View className='gap-1.5'>
											<View className='flex-row items-center gap-1.5 flex-wrap'>
												{item.routeLabel && (
													<View
														className='px-2 h-[22px] rounded-lg items-center justify-center'
														style={{ backgroundColor: item.color }}
													>
														<Text className='text-white text-[12px] font-pretendard-bold'>
															{item.routeLabel}
														</Text>
													</View>
												)}
												<Text className='text-primary text-[14px] font-pretendard-medium'>
													{item.title}역 승차
												</Text>
											</View>
											<Text className='text-black/45 text-[12px] font-pretendard-regular'>
												{item.stopCount}개 {item.stopSuffix} · {item.totalTime}
											</Text>
										</View>
									)}
									{item.type === 'alight' && (
										<Text className='text-primary text-[14px] font-pretendard-medium pt-1'>
											{item.title}
											{item.stopSuffix} 하차
										</Text>
									)}
								</>
							);

							if ((item.type === 'board' || item.type === 'alight') && item.coord) {
								const coord = item.coord;
								const label =
									item.type === 'board'
										? `${item.title}역`
										: `${item.title}${item.stopSuffix}`;
								return (
									<View className='flex-1 flex-row items-start pb-3'>
										<Pressable
											onPress={() => onFocusStop(coord)}
											className='flex-1'
											hitSlop={4}
											accessibilityRole='button'
											accessibilityLabel={`${label} 위치를 지도에서 보기`}
										>
											{content}
										</Pressable>
										<Pressable
											onPress={() => onOpenExternalMap({ coord, label })}
											hitSlop={8}
											className='w-7 h-7 items-center justify-center'
											accessibilityRole='button'
											accessibilityLabel={`${label} 외부 지도 앱에서 열기`}
										>
											<Ionicons
												name='share-outline'
												size={16}
												color='rgba(28,25,23,0.3)'
											/>
										</Pressable>
									</View>
								);
							}
							return <View className='flex-1 pb-3'>{content}</View>;
						})()}
					</Animated.View>
				);
			})}
		</View>
	);
}

interface RouteCandidateCardProps {
	route: RouteResult;
	mode: DirectionsMode;
	index: number;
	order: number;
	expanded: boolean;
	selected: boolean;
	destinationName?: string;
	originName?: string;
	onPressCard: (index: number) => void;
	onFocusStop: (coord: RouteCoord) => void;
	onOpenExternalMap: (target: ExternalMapTarget) => void;
}

// 대중교통 경로 후보 카드 — 헤더를 탭해야만 선택·펼침이 바뀐다. 펼쳐진 타임라인 안의
// 승차/하차 행은 별도로 지도 포커스를 트리거하므로, 카드 전체를 Pressable로 감싸지 않는다.
function RouteCandidateCard({
	route,
	mode,
	index,
	order,
	expanded,
	selected,
	destinationName,
	originName,
	onPressCard,
	onFocusStop,
	onOpenExternalMap,
}: RouteCandidateCardProps) {
	const reduceMotion = useReducedMotion();
	const pressScale = useSharedValue(1);
	const selection = useSharedValue(selected ? 1 : 0);
	const expansion = useSharedValue(expanded ? 1 : 0);

	useEffect(() => {
		selection.value = withTiming(selected ? 1 : 0, { duration: 240 });
	}, [selected, selection]);

	useEffect(() => {
		expansion.value = withSpring(expanded ? 1 : 0, SPRING_SETTLE);
	}, [expanded, expansion]);

	const cardStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScale.value }],
		borderColor: interpolateColor(
			selection.value,
			[0, 1],
			['rgba(28,25,23,0.06)', 'rgba(28,25,23,0.22)'],
		),
	}));

	const chevronStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${expansion.value * 180}deg` }],
	}));

	const handlePressIn = useCallback(() => {
		pressScale.value = withSpring(reduceMotion ? 1 : 0.978, SPRING_PRESS);
	}, [pressScale, reduceMotion]);

	const handlePressOut = useCallback(() => {
		pressScale.value = withSpring(1, SPRING_PRESS);
	}, [pressScale]);

	const handlePress = useCallback(() => {
		Haptics.selectionAsync();
		onPressCard(index);
	}, [index, onPressCard]);

	const summary = useMemo(() => buildSummary(route, mode), [route, mode]);

	return (
		<Animated.View
			layout={CARD_LAYOUT}
			entering={FadeInDown.springify()
				.damping(20)
				.stiffness(170)
				.delay(order * 60)}
		>
			<Animated.View
				className='rounded-[22px] bg-white border overflow-hidden'
				style={cardStyle}
			>
				<Pressable
					onPress={handlePress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					className={cn('px-4 pt-4', expanded ? 'pb-0' : 'pb-4')}
					accessibilityRole='button'
					accessibilityLabel={`경로 후보 ${order + 1}, ${summary.totalTime}, ${summary.totalDistance}`}
					accessibilityState={{ selected, expanded }}
				>
					<View className='flex-row items-start justify-between'>
						<View className='flex-1'>
							<RouteSummaryHeader
								summary={summary}
								showBar
								barDelay={order * 60 + 120}
							/>
						</View>
						<Animated.View
							style={[{ marginLeft: 8, marginTop: 6 }, chevronStyle]}
							pointerEvents='none'
						>
							<Ionicons name='chevron-down' size={18} color='rgba(28,25,23,0.3)' />
						</Animated.View>
					</View>
				</Pressable>

				{/* 접을 때는 exiting 없이 즉시 언마운트하고 카드 높이 스프링(layout)만 남긴다 —
            페이드아웃이 자리를 차지해 높이가 두 단계로 줄어드는 것을 막는다. */}
				{expanded && (
					<Animated.View entering={FadeIn.duration(220)} className='px-4 pb-4'>
						<View className='mt-4 pt-4 border-t border-black/[0.06]'>
							<RouteTimeline
								route={route}
								mode={mode}
								destinationName={destinationName}
								originName={originName}
								onFocusStop={onFocusStop}
								onOpenExternalMap={onOpenExternalMap}
							/>
						</View>
					</Animated.View>
				)}
			</Animated.View>
		</Animated.View>
	);
}

export function RouteSheet({
	mode,
	status,
	route,
	routes,
	selectedRouteIndex,
	onSelectRoute,
	onChangeMode,
	onFocusStop,
	destinationName,
	originName,
	bottomInset,
}: RouteSheetProps) {
	// 버스 후보 카드 중 상세 타임라인이 펼쳐진 카드 — 아코디언이라 한 번에 하나만 열린다.
	const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
	const [sortCriterion, setSortCriterion] = useState<SortCriterion>('time');
	// 승차/하차 행의 "외부 지도 앱에서 열기" 액션시트 대상 — null이면 시트가 닫혀 있다.
	const [externalMapTarget, setExternalMapTarget] =
		useState<ExternalMapTarget | null>(null);

	const handleCardPress = useCallback(
		(index: number) => {
			onSelectRoute(index);
			setExpandedIndex((prev) => (prev === index ? null : index));
		},
		[onSelectRoute],
	);

	const handleChangeCriterion = useCallback((criterion: SortCriterion) => {
		setSortCriterion(criterion);
	}, []);

	// 정렬은 표시 순서만 바꾼다 — routes 배열 자체의 인덱스는 그대로 유지해야
	// selectedRouteIndex/onSelectRoute가 지도에 그려진 경로와 계속 일치한다.
	const sortedRouteIndices = useMemo(
		() =>
			routes
				.map((_, i) => i)
				.sort((a, b) => compareRoutes(routes[a], routes[b], sortCriterion)),
		[routes, sortCriterion],
	);

	const walkSummary = useMemo(
		() => (route ? buildSummary(route, 'walk') : null),
		[route],
	);

	return (
		<BottomSheetScrollView
			className='px-5 pt-3'
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
		>
			<View className='mb-5'>
				<ModeToggle mode={mode} onChangeMode={onChangeMode} />
			</View>

			{/* mode/status가 바뀌면 통째로 교체되며 새 내용이 페이드인된다.
          exiting은 두지 않는다 — 사라지는 뷰가 잠시 자리를 차지해 높이가 튀기 때문. */}
			<Animated.View key={`${mode}-${status}`} entering={FadeIn.duration(240)}>
				{status === 'loading' && (
					<View className='flex-row items-center gap-2 py-6'>
						<ActivityIndicator size='small' color={colors.primary} />
						<Text className='text-black/50 text-[13px] font-pretendard-regular'>
							경로 찾는 중…
						</Text>
					</View>
				)}

				{status === 'error' && (
					<Text className='text-black/50 text-[13px] font-pretendard-regular py-6'>
						경로를 찾을 수 없어요
					</Text>
				)}

				{status === 'success' && mode === 'walk' && route && walkSummary && (
					<View className='pb-8'>
						<View className='rounded-[22px] bg-white px-4 py-4 border border-black/[0.06]'>
							<RouteSummaryHeader summary={walkSummary} showBar={false} />
							<View className='mt-4 pt-4 border-t border-black/[0.06]'>
								<RouteTimeline
									route={route}
									mode={mode}
									destinationName={destinationName}
									originName={originName}
									onFocusStop={onFocusStop}
									onOpenExternalMap={setExternalMapTarget}
								/>
							</View>
						</View>
					</View>
				)}

				{status === 'success' && mode === 'bus' && routes.length > 0 && (
					<View className='pb-8'>
						<View className='mb-3 gap-2.5'>
							<Text className='text-black/40 text-[11px] font-pretendard-bold tracking-[1.2px]'>
								경로 {routes.length}개
							</Text>
							<SortChips
								criterion={sortCriterion}
								onChangeCriterion={handleChangeCriterion}
							/>
						</View>

						<View className='gap-3'>
							{sortedRouteIndices.map((i, order) => (
								<RouteCandidateCard
									key={i}
									route={routes[i]}
									mode={mode}
									index={i}
									order={order}
									expanded={expandedIndex === i}
									selected={i === selectedRouteIndex}
									destinationName={destinationName}
									originName={originName}
									onPressCard={handleCardPress}
									onFocusStop={onFocusStop}
									onOpenExternalMap={setExternalMapTarget}
								/>
							))}
						</View>
					</View>
				)}
			</Animated.View>

			{externalMapTarget && (
				<ExternalMapSheet
					target={externalMapTarget}
					onClose={() => setExternalMapTarget(null)}
				/>
			)}
		</BottomSheetScrollView>
	);
}
