import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/src/hooks/usePressScale';
import { LoginRequiredPressable } from '../auth/LoginRequiredPressable';

interface ExhibitionImmersiveFabProps {
	onPress: () => void;
}

export function ExhibitionImmersiveFab({ onPress }: ExhibitionImmersiveFabProps) {
	const { style: pressStyle, setPressed } = usePressScale({
		pressedScale: 0.88,
		spring: { damping: 12 },
	});

	return (
		<LoginRequiredPressable
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				onPress();
			}}
			accessibilityLabel="몰입하기"
			accessibilityRole="button"
			hitSlop={8}
		>
			<Animated.View
				className="shadow-black elevation-md items-center"
				style={[
					pressStyle,
					{
						shadowOpacity: 0.25,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 3 },
					},
				]}
			>
				<View className="w-16 h-16 rounded-full items-center justify-center bg-secondary">
					<Ionicons name="headset" size={28} color="white" />
				</View>
			</Animated.View>
		</LoginRequiredPressable>
	);
}
