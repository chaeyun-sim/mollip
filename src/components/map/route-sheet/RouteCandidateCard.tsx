import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
	FadeIn,
	FadeInDown,
	interpolateColor,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { RouteSummaryHeader } from './RouteSummaryHeader';
import { RouteTimeline } from './RouteTimeline';
import { cn } from '@/src/lib/cn';
import { CARD_LAYOUT, SPRING_PRESS, SPRING_SETTLE, buildSummary } from './utils';
import type { ExternalMapTarget } from '@/src/components/map/ExternalMapSheet';
import type { RouteCoord, RouteResult } from '@/src/api/tmap';
import type { DirectionsMode } from '@/src/hooks/useDirections';

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
export function RouteCandidateCard({
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
		selection.set(withTiming(selected ? 1 : 0, { duration: 240 }));
	}, [selected, selection]);

	useEffect(() => {
		expansion.set(withSpring(expanded ? 1 : 0, SPRING_SETTLE));
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
		pressScale.set(withSpring(reduceMotion ? 1 : 0.978, SPRING_PRESS));
	}, [pressScale, reduceMotion]);

	const handlePressOut = useCallback(() => {
		pressScale.set(withSpring(1, SPRING_PRESS));
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
			<Animated.View className="rounded-[22px] bg-white border overflow-hidden" style={cardStyle}>
				<Pressable
					onPress={handlePress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					className={cn('px-4', expanded ? 'pt-4' : 'py-4')}
					accessibilityRole="button"
					accessibilityLabel={`경로 후보 ${order + 1}, ${summary.totalTime}, ${summary.totalDistance}`}
					accessibilityState={{ selected, expanded }}
				>
					<View className="flex-row items-start justify-between">
						<View className="flex-1">
							<RouteSummaryHeader summary={summary} showBar barDelay={order * 60 + 120} />
						</View>
						<Animated.View
							style={chevronStyle}
							className="ml-2 mt-1.5"
							pointerEvents="none"
						>
							<Ionicons name="chevron-down" size={18} className="text-gray900/30" />
						</Animated.View>
					</View>
				</Pressable>

				{/* 접을 때는 exiting 없이 즉시 언마운트하고 카드 높이 스프링(layout)만 남긴다 —
            페이드아웃이 자리를 차지해 높이가 두 단계로 줄어드는 것을 막는다. */}
				{expanded && (
					<Animated.View entering={FadeIn.duration(220)} className="px-4 pb-4">
						<View className="mt-4 pt-4 border-t border-black/[0.06]">
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
