import { ActivityIndicator, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';

interface CenteredLoaderProps {
	/**
	 * 컴포넌트 스타일
	 */
	className?: string;
}

export function CenteredLoader({
	className,
}: CenteredLoaderProps) {
	return (
		<View className={cn('items-center justify-center', className)}>
			<ActivityIndicator color={colors.muted} />
		</View>
	);
}
