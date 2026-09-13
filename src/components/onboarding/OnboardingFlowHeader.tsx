import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface OnboardingFlowHeaderProps {
	stepIndex: number;
	stepCount?: number;
	onSkip?: () => void;
}

export function OnboardingFlowHeader({
	stepIndex,
	stepCount = 3,
	onSkip,
}: OnboardingFlowHeaderProps) {
	return (
		<View className="pt-1 pb-3">
			<View className="flex-row justify-start min-h-[44px] items-center">
				{onSkip && (
					<Pressable
						onPress={onSkip}
						hitSlop={12}
						accessibilityRole="button"
						accessibilityLabel="건너뛰기"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Text className="text-secondary text-[15px] font-pretendard-medium">건너뛰기</Text>
					</Pressable>
				)}
			</View>
			<View className="flex-row justify-center gap-1.5 pt-1">
				{Array.from({ length: stepCount }).map((_, index) => (
					<View
						key={index}
						className={cn(
							'h-1.5 w-1.5 rounded-full',
							index === stepIndex ? 'bg-primary-dark' : 'bg-gray300',
						)}
					/>
				))}
			</View>
		</View>
	);
}
