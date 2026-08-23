import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

export interface CardRowProps {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	value?: string;
	onPress?: () => void;
	children?: React.ReactNode;
	last?: boolean;
	className?: string;
}

export function CardRow({
	icon,
	label,
	value,
	onPress,
	children,
	last = false,
	className,
}: CardRowProps) {
	const inner = (pressed: boolean) => (
		<View
			className={cn(
				'flex-row items-center justify-between px-4 py-[15px] border-[rgba(28,25,23,0.06)]',
				pressed ? 'opacity-50' : 'opacity-100',
				last ? 'border-b-0' : 'border-b',
				className,
			)}
		>
			<View className='flex-row items-center gap-3'>
				<Ionicons name={icon} size={17} color='#9C8F85' />
				<Text className='font-pretendard-regular text-primary text-[15px]'>
					{label}
				</Text>
			</View>
			{children ?? (
				<View className='flex-row items-center gap-1'>
					{value ? (
						<Text className='font-pretendard-regular text-[#B0A89E] text-[13px]'>
							{value}
						</Text>
					) : null}
					{onPress ? (
						<Ionicons name='chevron-forward' size={13} color='#BDB6AE' />
					) : null}
				</View>
			)}
		</View>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				accessibilityRole='button'
				accessibilityLabel={label}
			>
				{({ pressed }) => inner(pressed)}
			</Pressable>
		);
	}
	return inner(false);
}
