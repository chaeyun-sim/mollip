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
			style={{
				width: '100%',
				height: 44,
				borderRadius: 22,
				backgroundColor: TRACK,
				flexDirection: 'row',
				padding: 4,
			}}
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
						style={{
							flex: 1,
							flexBasis: 0,
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 1,
						}}
					>
						<Text
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.82}
							style={{
								fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
								fontSize: 14,
								color: selected ? INK : MUTED,
								paddingHorizontal: 6,
							}}
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
