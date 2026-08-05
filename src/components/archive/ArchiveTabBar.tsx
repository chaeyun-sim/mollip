import { cn } from '@/src/lib/cn';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';

export type ArchiveTab = 'diary' | 'saved';

const TABS: { value: ArchiveTab; label: string }[] = [
	{ value: 'diary', label: '관람 다이어리' },
	{ value: 'saved', label: '저장한 전시' },
];

const TRACK = '#F8F6F2';
const INK = '#1C1917';
const MUTED = '#78716C';

interface ArchiveTabBarProps {
	value: ArchiveTab;
	onChange: (value: ArchiveTab) => void;
}

/** 웜 cream 트랙 + 슬라이딩 white thumb (설정 pill / grey bar ❌) */
export function ArchiveTabBar({ value, onChange }: ArchiveTabBarProps) {
	const [trackWidth, setTrackWidth] = useState(0);
	const tabIndex = value === 'diary' ? 0 : 1;
	const slideIndex = useSharedValue(tabIndex);

	useEffect(() => {
		slideIndex.value = withSpring(tabIndex, { damping: 22, stiffness: 280 });
	}, [tabIndex, slideIndex]);

	const onTrackLayout = (e: LayoutChangeEvent) => {
		setTrackWidth(e.nativeEvent.layout.width);
	};

	const thumbStyle = useAnimatedStyle(() => {
		if (trackWidth <= 0) return { opacity: 0 };
		const inset = 4;
		const tabW = (trackWidth - inset * 2) / TABS.length;
		return {
			opacity: 1,
			width: tabW,
			transform: [{ translateX: inset + slideIndex.value * tabW }],
		};
	}, [trackWidth]);

	return (
		<View
			onLayout={onTrackLayout}
			className='w-full h-[44px] rounded-[22px] flex-row px-1'
			style={{ backgroundColor: TRACK }}
		>
			<Animated.View
				pointerEvents='none'
				style={[
					{
						position: 'absolute',
						top: 4,
						bottom: 4,
						borderRadius: 18,
						backgroundColor: '#FFFFFF',
						shadowColor: INK,
						shadowOpacity: 0.1,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 2 },
						elevation: 2,
					},
					thumbStyle,
				]}
			/>

			{TABS.map((tab) => {
				const selected = value === tab.value;
				return (
					<Pressable
						key={tab.value}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onChange(tab.value);
						}}
						accessibilityRole='tab'
						accessibilityState={{ selected }}
						accessibilityLabel={tab.label}
						className='flex-1 flex-basis-0 items-center justify-center z-10'
					>
						<Text
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.82}
							className={cn(
								'text-[14px] px-[6px]',
								selected ? 'font-pretendard-semibold' : 'font-pretendard-regular',
							)}
							style={{ color: selected ? INK : MUTED }}
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
