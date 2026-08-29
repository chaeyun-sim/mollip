import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { cn } from '@/src/lib/cn';

export type ChipVariant = 'elevated' | 'tonal';

const INACTIVE_BACKGROUND: Record<ChipVariant, string> = {
	elevated: 'bg-white',
	tonal: 'bg-bg-tonal',
};

interface ChipProps {
	label: string;
	active: boolean;
	onPress: () => void;
	icon?: keyof typeof Ionicons.glyphMap;
	/** elevated: 흰 배경+그림자(지도 등 유색 배경 위) / tonal: 웜 뉴트럴 배경(흰 화면 위) */
	variant?: ChipVariant;
	accessibilityLabel?: string;
}

/** 선택 토글 칩. active일 때 배경이 primary로 바뀌고, 아이콘이 없으면 체크마크가 붙는다. */
export function Chip({
	label,
	active,
	onPress,
	icon,
	variant = 'tonal',
	accessibilityLabel,
}: ChipProps) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityLabel={accessibilityLabel ?? `${label} 필터`}
			accessibilityRole="button"
			accessibilityState={{ selected: active }}
			className={cn(
				'flex-row items-center gap-1 rounded-full px-3.5 py-2',
				active ? 'bg-primary-dark' : INACTIVE_BACKGROUND[variant],
			)}
			style={({ pressed }) => [
				variant === 'elevated' && !active
					? {
							shadowColor: '#000',
							shadowOpacity: 0.1,
							shadowRadius: 4,
							shadowOffset: { width: 0, height: 1 },
							elevation: 2,
						}
					: null,
				{ opacity: pressed ? 0.7 : 1 },
			]}
		>
			{active && !icon && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
			{icon && (
				<Ionicons name={icon} size={13} className={cn(active ? 'text-white' : 'text-gray700')} />
			)}
			<Text
				className={cn(
					'text-[13px]',
					active ? 'text-white font-pretendard-semibold' : 'text-gray700 font-pretendard-medium',
				)}
			>
				{label}
			</Text>
		</Pressable>
	);
}
