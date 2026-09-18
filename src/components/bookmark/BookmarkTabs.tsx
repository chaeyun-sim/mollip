import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cn } from '@/src/lib/cn';

export type BookmarkTab = 'exhibition' | 'audio';

interface BookmarkTabsProps {
	tab: BookmarkTab;
	onChangeTab: (tab: BookmarkTab) => void;
	className?: string;
}

const TABS = [
	{ key: 'exhibition', label: '관심 전시' },
	{ key: 'audio', label: '다시 들을 오디오' },
] as const;

const INDICATOR_HEIGHT = 2;

export function BookmarkTabs({ tab, onChangeTab, className }: BookmarkTabsProps) {
	const [trackWidth, setTrackWidth] = useState(0);
	const tabIndex = tab === 'exhibition' ? 0 : 1;
	const slideIndex = useSharedValue(tabIndex);

	useEffect(() => {
		slideIndex.value = withSpring(tabIndex, { damping: 22, stiffness: 220, mass: 0.5 });
	}, [tabIndex, slideIndex]);

	const indicatorStyle = useAnimatedStyle(() => {
		if (trackWidth <= 0) return { opacity: 0 };

		const tabW = trackWidth / TABS.length;
		return {
			opacity: 1,
			width: tabW,
			transform: [{ translateX: slideIndex.value * tabW }],
		};
	}, [trackWidth]);

	return (
		<View
			onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
			className={cn('w-full flex-row border-b border-gray300 mt-1 mb-4', className)}
			accessibilityRole="tablist"
		>
			{TABS.map(({ key, label }) => {
				const selected = tab === key;
				return (
					<Pressable
						key={key}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onChangeTab(key);
						}}
						accessibilityRole="tab"
						accessibilityState={{ selected }}
						accessibilityLabel={label}
						className="flex-1 items-center justify-center py-3"
					>
						<Text
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.82}
							className={cn(
								'text-[15px] px-1.5',
								selected
									? 'font-pretendard-semibold text-gray900'
									: 'font-pretendard-regular text-gray600',
							)}
						>
							{label}
						</Text>
					</Pressable>
				);
			})}

			<Animated.View
				pointerEvents="none"
				className="absolute bottom-0 left-0 rounded-full bg-primary-dark"
				style={[{ height: INDICATOR_HEIGHT }, indicatorStyle]}
			/>
		</View>
	);
}
