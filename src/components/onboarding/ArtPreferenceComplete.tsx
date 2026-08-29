import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';

interface ArtPreferenceCompleteProps {
	likedCount: number;
	buttonLabel: string;
	onPress: () => void;
	disabled?: boolean;
}

/** 취향 선택 완료 화면. 온보딩("다음으로")과 취향 재설정("저장하기")이 버튼 라벨만 다르게 공유한다. */
export function ArtPreferenceComplete({
	likedCount,
	buttonLabel,
	onPress,
	disabled = false,
}: ArtPreferenceCompleteProps) {
	return (
		<>
			<View className="flex-1 items-center justify-center gap-4">
				<Text className="text-5xl">🎨</Text>
				<Text className="text-gray900 text-xl font-pretendard-bold">완료!</Text>
				<Text className="text-description text-[13px] font-pretendard-regular text-center leading-5">
					{likedCount > 0
						? `${likedCount}개의 취향을 저장했어요\n맞춤 전시를 추천해드릴게요`
						: '다음에 취향을 설정해도 괜찮아요'}
				</Text>
			</View>
			<Screen.Bottom className="pb-12">
				<Pressable
					className="w-full bg-secondary flex-row items-center justify-center rounded-[18px] py-[18px] gap-2.5 border-[0.5px] border-white/25"
					style={({ pressed }) => ({ opacity: pressed || disabled ? 0.6 : 1 })}
					onPress={onPress}
					disabled={disabled}
					accessibilityRole="button"
					accessibilityLabel={buttonLabel}
				>
					<Text className="text-[16px] text-white font-pretendard-semibold">{buttonLabel}</Text>
				</Pressable>
			</Screen.Bottom>
		</>
	);
}
