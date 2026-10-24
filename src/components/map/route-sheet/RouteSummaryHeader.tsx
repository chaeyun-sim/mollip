import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BAR_WIDTH_SCALE, type RouteSummaryData } from './utils';

interface RouteSummaryHeaderProps {
	summary: RouteSummaryData;
	showBar: boolean;
	barDelay?: number;
}

// 경로 카드의 상단 요약 — "27분" 디스플레이 타입 + 거리·환승·요금 칩 + 구간 바
export function RouteSummaryHeader({ summary, showBar, barDelay = 0 }: RouteSummaryHeaderProps) {
	return (
		<>
			<View className="flex-row items-baseline gap-2">
				<Text className="text-gray900 text-[30px] leading-[34px] font-pretendard-bold tracking-[-0.8px]">
					{summary.totalTime}
				</Text>
				<View className="flex flex-row items-center gap-2">
					<Text className="text-black/40 text-[14px] font-pretendard-medium">
						{summary.totalDistance}
					</Text>
					{summary.fareText && (
						<View className="flex-row items-center gap-1 px-2.5 h-[26px] rounded-full bg-black/[0.045]">
							<Ionicons name="card-outline" size={11} className="text-gray900/50" />
							<Text className="text-black/55 text-[11px] font-pretendard-semibold">
								{summary.fareText}
							</Text>
						</View>
					)}
				</View>
			</View>

			{showBar && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					className="mt-3.5"
					contentContainerClassName="gap-[3px]"
				>
					{summary.legBars.map((bar, i) => (
						<Animated.View
							key={bar.key}
							entering={FadeIn.duration(260).delay(barDelay + i * 55)}
							className="items-center justify-center flex-row gap-1.5 px-2.5 h-[34px] rounded-[11px]"
							style={{
								width: Math.max(64, bar.flex * BAR_WIDTH_SCALE),
								backgroundColor: bar.color,
							}}
						>
							<Ionicons name={bar.icon} size={13} color="white" />
							<Text className="text-white text-xs font-pretendard-bold" numberOfLines={1}>
								{bar.time}
							</Text>
						</Animated.View>
					))}
				</ScrollView>
			)}
		</>
	);
}
