import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';

export interface CardRowProps {
	label: string;
	value?: string;
	onPress?: () => void;
	children?: ReactNode;
	className?: string;
}

export function CardRow({ label, value, onPress, children, className }: CardRowProps) {
	const rowClassName = cn('flex-row items-center justify-between h-14', className);

	const content = (
		<>
			<Text className="font-pretendard-semibold text-gray900 py-1 text-[16px]">{label}</Text>
			{children ?? (
				<View className="flex-row items-center gap-1">
					{value && (
						<Text className="font-pretendard-regular text-[#B0A89E] text-[14px]">{value}</Text>
					)}
					{onPress && <Ionicons name="chevron-forward" size={18} className="text-gray500" />}
				</View>
			)}
		</>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				className={rowClassName}
				accessibilityRole="button"
				accessibilityLabel={label}
				style={({ pressed }) => (pressed ? { opacity: 0.5 } : undefined)}
			>
				{content}
			</Pressable>
		);
	}

	return <View className={rowClassName}>{content}</View>;
}
