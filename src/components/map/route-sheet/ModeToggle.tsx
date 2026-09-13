import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cn } from '@/src/lib/cn';
import type { DirectionsMode } from '@/src/hooks/useDirections';
import { SPRING_SETTLE } from './utils';

interface ModeToggleProps {
	mode: DirectionsMode;
	onChangeMode: (mode: DirectionsMode) => void;
}

const MODE_ITEMS: {
	key: DirectionsMode;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}[] = [
	{ key: 'walk', label: '도보', icon: 'walk' },
	{ key: 'bus', label: '대중교통', icon: 'bus' },
];

const TOGGLE_PADDING = 4;

// 도보/대중교통 전환 — 선택 알약이 손가락을 따라가듯 스프링으로 미끄러진다.
export function ModeToggle({ mode, onChangeMode }: ModeToggleProps) {
	const [trackWidth, setTrackWidth] = useState(0);
	const progress = useSharedValue(mode === 'walk' ? 0 : 1);
	const pillWidth = trackWidth > 0 ? (trackWidth - TOGGLE_PADDING * 2) / MODE_ITEMS.length : 0;

	useEffect(() => {
		progress.set(withSpring(mode === 'walk' ? 0 : 1, SPRING_SETTLE));
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
			className="w-full flex-row rounded-2xl bg-black/[0.045]"
			style={{ padding: TOGGLE_PADDING }}
		>
			{pillWidth > 0 && (
				<Animated.View
					pointerEvents="none"
					className="absolute rounded-xl bg-gray900"
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
						className="flex-1 flex-row items-center justify-center gap-1.5 h-10"
						hitSlop={6}
						accessibilityRole="button"
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
