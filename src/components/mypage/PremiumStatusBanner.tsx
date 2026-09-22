import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

interface PremiumStatusBannerProps {
	/** "2026-10-21" 형태의 만료일 텍스트 */
	expiresAt: string;
	onPress?: () => void;
}

export function PremiumStatusBanner({ expiresAt, onPress }: PremiumStatusBannerProps) {
	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			accessibilityRole="button"
			accessibilityLabel={`프리미엄 이용 중, ${expiresAt}까지`}
			style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
		>
			<LinearGradient
				colors={['#171412', '#7C3AED', '#E985FF']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				className="flex-row items-center justify-between rounded-2xl p-4"
			>
				<View className="flex-row items-center gap-2.5">
					<Ionicons name="sparkles" size={18} color="#FFFFFF" />
					<Text className="font-pretendard-bold text-white text-[15px]">Premium 이용 중</Text>
				</View>
				<View className="flex-row items-center gap-1">
					<Text className="font-pretendard-medium text-white/80 text-[13px]">구독 관리</Text>
					{onPress && <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />}
				</View>
			</LinearGradient>
		</Pressable>
	);
}
