import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { cn } from '@/src/lib/cn';

export type VenueExhibitionTab = 'active' | 'upcoming';

interface VenueExhibitionTabsProps {
	tab: VenueExhibitionTab;
	onChangeTab: (tab: VenueExhibitionTab) => void;
	activeCount: number;
	upcomingCount: number;
}

export function VenueExhibitionTabs({
	tab,
	onChangeTab,
	activeCount,
	upcomingCount,
}: VenueExhibitionTabsProps) {
	const [trackWidth, setTrackWidth] = useState(0);
	const tabIndex = tab === 'active' ? 0 : 1;
	const slideIndex = useSharedValue(tabIndex);

	useEffect(() => {
		slideIndex.value = withTiming(tabIndex, {
			duration: 180,
			easing: Easing.out(Easing.cubic),
		});
	}, [slideIndex, tabIndex]);

	const indicatorStyle = useAnimatedStyle(() => {
		if (trackWidth <= 0) return { opacity: 0 };
		const tabWidth = trackWidth / 2;
		return {
			opacity: 1,
			width: tabWidth,
			transform: [{ translateX: slideIndex.value * tabWidth }],
		};
	}, [trackWidth]);

	return (
		<>
			<View
				onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
				className="mb-4 w-full flex-row"
				accessibilityRole="tablist"
			>
				{(
					[
						['active', '진행 중', activeCount],
						['upcoming', '예정', upcomingCount],
					] as const
				).map(([key, label, count]) => (
					<Pressable
						key={key}
						onPress={() => onChangeTab(key)}
						className="flex-1 items-center justify-center py-3"
						style={({ pressed }) => pressed && { opacity: 0.6 }}
						accessibilityRole="tab"
						accessibilityState={{ selected: tab === key }}
						accessibilityLabel={`${label} 전시 ${count}개`}
					>
						<Text
							className={cn(
								'text-[15px] px-1.5',
								tab === key
									? 'font-pretendard-semibold text-primary-dark'
									: 'font-pretendard-regular text-gray600',
							)}
						>
							{label} <Text className="text-[13px] font-pretendard-medium">{count}</Text>
						</Text>
					</Pressable>
				))}
				<Animated.View
					pointerEvents="none"
					className="absolute bottom-0 mt-1 left-0 h-0.5 rounded-full bg-primary-dark z-10"
					style={indicatorStyle}
				/>
			</View>
			<View className="h-px w-full bg-gray300 absolute bottom-[14.5px] left-0 z-0" />
		</>
	);
}
