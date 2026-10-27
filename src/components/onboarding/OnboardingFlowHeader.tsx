import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();

	return (
		<View className="pt-1 pb-3">
			<View className="flex-row justify-start min-h-[44px] items-center">
				{onSkip && (
					<Pressable
						onPress={onSkip}
						hitSlop={12}
						accessibilityRole="button"
						accessibilityLabel={t('onboarding.skip_action')}
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Text className="text-secondary text-[15px] font-pretendard-medium">
							{t('onboarding.skip_action')}
						</Text>
					</Pressable>
				)}
			</View>
			<View className="flex-row justify-center gap-1.5 pt-1">
				{Array.from({ length: stepCount }).map((_, index) => (
					<View
						key={index}
						className={cn(
							'h-1.5 w-1.5 rounded-full',
							index === stepIndex ? 'bg-brand' : 'bg-gray300',
						)}
					/>
				))}
			</View>
		</View>
	);
}
