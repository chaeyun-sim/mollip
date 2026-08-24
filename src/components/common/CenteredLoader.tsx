import { ActivityIndicator, View } from 'react-native';

import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';

interface CenteredLoaderProps {
	color?: string;
	className?: string;
}

/** 중앙 정렬 로딩 스피너 블록. 여백·flex는 className으로 조절한다. */
export function CenteredLoader({
	color = colors.muted,
	className,
}: CenteredLoaderProps) {
	return (
		<View className={cn('items-center justify-center', className)}>
			<ActivityIndicator color={color} />
		</View>
	);
}
