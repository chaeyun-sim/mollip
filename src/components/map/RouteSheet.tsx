import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ModeToggle } from './route-sheet/ModeToggle';
import { RouteCandidateCard } from './route-sheet/RouteCandidateCard';
import { RouteSummaryHeader } from './route-sheet/RouteSummaryHeader';
import { RouteTimeline } from './route-sheet/RouteTimeline';
import { SortChips } from './route-sheet/SortChips';
import { buildSummary, compareRoutes, type SortCriterion } from './route-sheet/utils';
import { ExternalMapSheet, type ExternalMapTarget } from '@/src/components/map/ExternalMapSheet';
import type { RouteCoord, RouteResult } from '@/src/api/tmap';
import type { DirectionsMode } from '@/src/hooks/useDirections';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';
import { Indicator } from '../common/Indicator';

interface RouteSheetProps {
	mode: DirectionsMode;
	status: AsyncStatus;
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
	const [externalMapTarget, setExternalMapTarget] = useState<ExternalMapTarget | null>(null);

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
			routes.map((_, i) => i).sort((a, b) => compareRoutes(routes[a], routes[b], sortCriterion)),
		[routes, sortCriterion],
	);

	const walkSummary = useMemo(() => (route ? buildSummary(route, 'walk') : null), [route]);

	return (
		<BottomSheetScrollView
			className="px-5 pt-3"
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
		>
			<View className="mb-5">
				<ModeToggle mode={mode} onChangeMode={onChangeMode} />
			</View>

			{/* mode/status가 바뀌면 통째로 교체되며 새 내용이 페이드인된다.
          exiting은 두지 않는다 — 사라지는 뷰가 잠시 자리를 차지해 높이가 튀기 때문. */}
			<Animated.View key={`${mode}-${status}`} entering={FadeIn.duration(240)}>
				{status === 'loading' && (
					<View className="flex-row items-center gap-2 py-6">
						<Indicator size="small" color="gray900" />
						<Text className="text-black/50 text-[13px] font-pretendard-regular">경로 찾는 중…</Text>
					</View>
				)}

				{status === 'error' && (
					<Text className="text-black/50 text-[13px] font-pretendard-regular py-6">
						경로를 찾을 수 없어요
					</Text>
				)}

				{status === 'success' && mode === 'walk' && route && walkSummary && (
					<View className="pb-8">
						<View className="rounded-[22px] bg-white px-4 py-4 border border-black/[0.06]">
							<RouteSummaryHeader summary={walkSummary} showBar={false} />
							<View className="mt-4 pt-4 border-t border-black/[0.06]">
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
					<View className="pb-8">
						<View className="mb-3 gap-2.5">
							<Text className="text-black/40 text-[11px] font-pretendard-bold tracking-[1.2px]">
								경로 {routes.length}개
							</Text>
							<SortChips criterion={sortCriterion} onChangeCriterion={handleChangeCriterion} />
						</View>

						<View className="gap-3">
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
				<ExternalMapSheet target={externalMapTarget} onClose={() => setExternalMapTarget(null)} />
			)}
		</BottomSheetScrollView>
	);
}
