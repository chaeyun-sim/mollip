import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { ExternalMapTarget } from '@/src/components/map/ExternalMapSheet';
import { buildTimeline } from './utils';
import type { RouteCoord, RouteResult } from '@/src/api/tmap';
import type { DirectionsMode } from '@/src/hooks/useDirections';

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
export function RouteTimeline({
	route,
	mode,
	destinationName,
	originName,
	onFocusStop,
	onOpenExternalMap,
}: RouteTimelineProps) {
	const items = useMemo(
		() => buildTimeline(route, destinationName ?? '도착지', originName ?? '출발지'),
		[route, destinationName, originName],
	);

	return (
		<View>
			{items.map((item, i) => {
				const isLast = mode === 'walk' ? true : i === items.length - 1;
				// 승차 구간에서 이어지는 선만 노선 색을 쓰고, 나머지는 잉크 톤으로 눌러 둔다.
				const connectorColor = item.type === 'board' ? item.color : 'rgba(28,25,23,0.12)';

				return (
					<Animated.View
						key={item.key}
						entering={FadeInDown.duration(260).delay(i * 45)}
						className="flex-row"
					>
						<View className="items-center w-[44px]">
							{mode === 'bus' && item.type === 'endpoint' && (
								<View
									className="w-[22px] h-[22px] rounded-full items-center justify-center bg-gray900/[0.08]"
								>
									{item.variant === 'start' ? (
										<View className="w-[8px] h-[8px] rounded-full bg-primary" />
									) : (
										<Ionicons name="flag" size={11} className="text-gray900" />
									)}
								</View>
							)}
							{item.type === 'walk' && (
								<View className="w-[22px] h-[22px] rounded-full items-center justify-center bg-black/[0.28]">
									<Ionicons name="walk" size={12} className="text-white" />
								</View>
							)}
							{item.type === 'board' && (
								<View
									className="w-[26px] h-[26px] rounded-full items-center justify-center"
									style={{ backgroundColor: item.color }}
								>
									<Ionicons name={item.icon} size={15} className="text-white" />
								</View>
							)}
							{item.type === 'alight' && (
								<View
									className="w-[26px] h-[26px] rounded-full items-center justify-center bg-white border-[1.5px]"
									style={{ borderColor: item.color }}
								>
									<Text className="text-[10px] font-pretendard-bold" style={{ color: item.color }}>
										하차
									</Text>
								</View>
							)}
							{!isLast && (
								<View
									className="w-[2px] rounded-full mt-1 mb-1 flex-1 min-h-[26px] opacity-55"
									style={{ backgroundColor: connectorColor }}
								/>
							)}
						</View>

						{(() => {
							const content = (
								<>
									{mode === 'bus' && item.type === 'endpoint' && (
										<Text className="text-gray900 text-sm font-pretendard-bold pt-0.5">
											{item.label}
										</Text>
									)}
									{item.type === 'walk' && (
										<View className="gap-1">
											<Text className="text-gray900 text-sm font-pretendard-medium">
												{item.routeLabel}
											</Text>
											<Text className="text-black/45 text-xs font-pretendard-regular">
												{item.totalTime}, {item.length}
											</Text>
										</View>
									)}
									{item.type === 'board' && (
										<View className="gap-1.5">
											<View className="flex-row items-center gap-1.5 flex-wrap">
												{item.routeLabel && (
													<View
														className="px-2 h-[22px] rounded-lg items-center justify-center"
														style={{ backgroundColor: item.color }}
													>
														<Text className="text-white text-[12px] font-pretendard-bold">
															{item.routeLabel}
														</Text>
													</View>
												)}
												<Text className="text-gray900 text-sm font-pretendard-medium">
													{item.title}역 승차
												</Text>
											</View>
											<Text className="text-black/45 text-xs font-pretendard-regular">
												{item.stopCount}개 {item.stopSuffix} · {item.totalTime}
											</Text>
										</View>
									)}
									{item.type === 'alight' && (
										<Text className="text-gray900 text-sm font-pretendard-medium pt-1">
											{item.title}
											{item.stopSuffix} 하차
										</Text>
									)}
								</>
							);

							if ((item.type === 'board' || item.type === 'alight') && item.coord) {
								const coord = item.coord;
								const label =
									item.type === 'board' ? `${item.title}역` : `${item.title}${item.stopSuffix}`;
								return (
									<View className="flex-1 flex-row items-start pb-3">
										<Pressable
											onPress={() => onFocusStop(coord)}
											className="flex-1"
											hitSlop={4}
											accessibilityRole="button"
											accessibilityLabel={`${label} 위치를 지도에서 보기`}
										>
											{content}
										</Pressable>
										<Pressable
											onPress={() => onOpenExternalMap({ coord, label })}
											hitSlop={8}
											className="w-7 h-7 items-center justify-center"
											accessibilityRole="button"
											accessibilityLabel={`${label} 외부 지도 앱에서 열기`}
										>
											<Ionicons name="share-outline" size={16} className="text-gray900/30" />
										</Pressable>
									</View>
								);
							}
							return <View className="flex-1 pb-3">{content}</View>;
						})()}
					</Animated.View>
				);
			})}
		</View>
	);
}
