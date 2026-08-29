import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ExhibitionTicketCTAProps {
	ticketUrl: string;
}

export function ExhibitionTicketCTA({ ticketUrl }: ExhibitionTicketCTAProps) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		void WebBrowser.openBrowserAsync(ticketUrl);
	};

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withTiming(0.97, { duration: 100 });
			}}
			onPressOut={() => {
				scale.value = withTiming(1, { duration: 150 });
			}}
			onPress={handlePress}
			accessibilityLabel="예매하기"
			accessibilityRole="button"
		>
			<Animated.View
				style={animatedStyle}
				className="mx-5 my-3 rounded-2xl py-[18px] flex-row items-center justify-center gap-2.5 bg-secondary"
			>
				<Ionicons name="ticket-outline" size={20} color="white" />
				<Text className="font-pretendard-bold text-[16px] text-white">예매하기</Text>
			</Animated.View>
		</Pressable>
	);
}
