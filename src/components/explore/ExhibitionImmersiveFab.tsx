import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ExhibitionImmersiveFabProps {
	onPress: () => void;
}

export function ExhibitionImmersiveFab({ onPress }: ExhibitionImmersiveFabProps) {
	const pressScale = useSharedValue(1);
	const pressStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScale.value }],
	}));

	return (
		<Pressable
			onPressIn={() => {
				pressScale.value = withSpring(0.88, { damping: 12 });
			}}
			onPressOut={() => {
				pressScale.value = withSpring(1, { damping: 12 });
			}}
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				onPress();
			}}
			accessibilityLabel='몰입하기'
			accessibilityRole='button'
			hitSlop={8}
		>
			<Animated.View style={pressStyle} className='items-center'>
				<View className='w-14 h-14 rounded-full items-center justify-center bg-white/18 border-[1.5px] border-white/45'>
					<Ionicons name='headset' size={24} color='white' />
				</View>
				<Text className='text-white/70 text-[10px] font-pretendard-medium text-center mt-1.5'>
					몰입하기
				</Text>
			</Animated.View>
		</Pressable>
	);
}
