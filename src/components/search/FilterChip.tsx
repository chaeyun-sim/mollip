import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { cn } from '@/src/lib/cn';

interface FilterChipProps {
	label: string;
	active: boolean;
	onPress: () => void;
	icon?: keyof typeof Ionicons.glyphMap;
	accessibilityLabel?: string;
}

export function FilterChip({ label, active, onPress, icon, accessibilityLabel }: FilterChipProps) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityLabel={accessibilityLabel ?? `${label} 필터`}
			accessibilityRole='button'
			accessibilityState={{ selected: active }}
			className={cn(
				'flex-row items-center gap-1 rounded-full px-3.5 py-2',
				active ? 'bg-[#1C1917]' : 'bg-[#F2EFE9]',
			)}
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			{icon && <Ionicons name={icon} size={13} color={active ? '#FFFFFF' : '#57534E'} />}
			<Text
				className={cn('text-[13px]', active ? 'text-white' : 'text-[#57534E]')}
				style={{ fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Medium' }}
			>
				{label}
			</Text>
		</Pressable>
	);
}
