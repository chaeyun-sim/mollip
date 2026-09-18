import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/src/hooks/usePressScale';

interface ExhibitionTicketCTAProps {
	ticketUrl: string;
}

export function ExhibitionTicketCTA({ ticketUrl }: ExhibitionTicketCTAProps) {
	const { style: animatedStyle, setPressed } = usePressScale();

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		void WebBrowser.openBrowserAsync(ticketUrl);
	};

	return (
		<Pressable
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
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
