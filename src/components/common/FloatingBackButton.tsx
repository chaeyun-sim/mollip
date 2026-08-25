import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';

import { FloatingIconButton, type FloatingIconButtonVariant } from '@/src/components/common/FloatingIconButton';

interface FloatingBackButtonProps {
	onPress: () => void;
	variant?: FloatingIconButtonVariant;
	className?: string;
	style?: StyleProp<ViewStyle>;
}

/** 원형 뒤로가기 버튼. 배경 톤·press 피드백은 variant로 결정한다(FloatingIconButton 참고). */
export function FloatingBackButton({ onPress, variant, className, style }: FloatingBackButtonProps) {
	return (
		<FloatingIconButton
			onPress={onPress}
			icon={<Ionicons name='chevron-back' size={22} color='#1a1a1a' />}
			accessibilityLabel='뒤로가기'
			variant={variant}
			className={className}
			style={style}
		/>
	);
}
