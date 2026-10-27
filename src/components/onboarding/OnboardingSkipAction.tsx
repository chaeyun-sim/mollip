import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { cn } from '@/src/lib/cn';

interface OnboardingSkipActionProps {
	onPress: () => void;
	className?: string;
}

/** 프롤로그·큐레이션 헤더가 공유하는 "나중에 설정" 텍스트 버튼 (카피·접근성 규칙 통일). */
export function OnboardingSkipAction({ onPress, className }: OnboardingSkipActionProps) {
	const { t } = useTranslation();

	return (
		<Pressable
			onPress={onPress}
			hitSlop={8}
			accessibilityRole="button"
			accessibilityLabel={t('onboarding.setup_later')}
			className={cn('min-h-11 min-w-11 items-center justify-center px-2', className)}
			style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
		>
			<Text className="text-gray700 text-[13px] font-pretendard-medium underline">스킵하기</Text>
		</Pressable>
	);
}
