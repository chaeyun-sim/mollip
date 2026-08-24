import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface RetryErrorStateProps {
	message: string;
	onRetry: () => void;
	retryAccessibilityLabel: string;
	className?: string;
}

/** 에러 메시지 + "다시 시도" 버튼. 여백·flex는 className으로 조절한다. */
export function RetryErrorState({
	message,
	onRetry,
	retryAccessibilityLabel,
	className,
}: RetryErrorStateProps) {
	return (
		<View className={cn('items-center justify-center gap-2', className)}>
			<Text className='text-muted text-[13px] font-pretendard-regular'>
				{message}
			</Text>
			<Pressable
				onPress={onRetry}
				accessibilityLabel={retryAccessibilityLabel}
				accessibilityRole='button'
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			>
				<Text className='text-primary text-[13px] font-pretendard-semibold'>
					다시 시도
				</Text>
			</Pressable>
		</View>
	);
}
