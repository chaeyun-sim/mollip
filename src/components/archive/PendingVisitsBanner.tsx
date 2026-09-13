import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface PendingVisitsBannerProps {
	count: number;
	onPress: () => void;
}

// 미확정(pending) 관람 기록 개수를 알리는 배너 — 다이어리 홈 전용, 탭하면 확정 큐로 이동
export function PendingVisitsBanner({ count, onPress }: PendingVisitsBannerProps) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`미확정 관람 기록 ${count}개, 확인하러 가기`}
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
			className="flex-row items-center rounded-2xl border-[1px] border-dashed border-gray300 bg-bg-tonal px-4 mt-4 py-3.5 mb-5 min-h-[56px]"
		>
			<View className="w-9 h-9 rounded-full items-center justify-center bg-white mr-3">
				<Ionicons name="receipt-outline" size={18} className="text-gray700" />
			</View>
			<View className="flex-1">
				<Text className="font-pretendard-semibold text-[13.5px] text-gray900">
					최근 저장하지 못한 관람 기록이 {count}개 있어요
				</Text>
				<Text className="mt-0.5 font-pretendard-regular text-[11.5px] text-gray600">
					7일이 지나면 사라져요 · 지금 확인하기
				</Text>
			</View>
			<Ionicons name="chevron-forward" size={16} className="text-gray500" />
		</Pressable>
	);
}
