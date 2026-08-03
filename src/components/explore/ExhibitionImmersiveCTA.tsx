import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

interface ExhibitionImmersiveCTAProps {
	onPress: () => void;
}

export function ExhibitionImmersiveCTA({ onPress }: ExhibitionImmersiveCTAProps) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withTiming(0.97, { duration: 100 });
			}}
			onPressOut={() => {
				scale.value = withTiming(1, { duration: 150 });
			}}
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				onPress();
			}}
			accessibilityLabel='몰입하기, 오디오 가이드 시작'
			accessibilityRole='button'
		>
			<Animated.View
				style={[animatedStyle, { backgroundColor: '#1C1917' }]}
				className='mx-5 my-3 rounded-2xl py-[18px] flex-row items-center justify-center gap-2.5'
			>
				<Ionicons name='headset' size={20} color='white' />
				<Text className='font-pretendard-bold text-[16px] text-white'>몰입하기</Text>
			</Animated.View>
		</Pressable>
	);
}
