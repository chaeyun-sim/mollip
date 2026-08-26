import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LoginRequiredPressable } from '../auth/LoginRequiredPressable';

const FAB_SHADOW = {
	shadowColor: '#000',
	shadowOpacity: 0.25,
	shadowRadius: 8,
	shadowOffset: { width: 0, height: 3 },
	elevation: 6,
} as const;

interface ExhibitionImmersiveFabProps {
	onPress: () => void;
}

export function ExhibitionImmersiveFab({ onPress }: ExhibitionImmersiveFabProps) {
	const pressScale = useSharedValue(1);
	const pressStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScale.value }],
	}));

	return (
		<LoginRequiredPressable
			onPressIn={() => {
				pressScale.set(withSpring(0.88, { damping: 12 }));
			}}
			onPressOut={() => {
				pressScale.set(withSpring(1, { damping: 12 }));
			}}
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				onPress();
			}}
			accessibilityLabel="몰입하기"
			accessibilityRole="button"
			hitSlop={8}
		>
			<Animated.View style={[pressStyle, FAB_SHADOW]} className="items-center">
				<View className="w-16 h-16 rounded-full items-center justify-center bg-primary">
					<Ionicons name="headset" size={28} color="white" />
				</View>
			</Animated.View>
		</LoginRequiredPressable>
	);
}
