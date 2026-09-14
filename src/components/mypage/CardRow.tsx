import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

export interface CardRowProps {
	label: string;
	description?: string;
	value?: string;
	onPress?: () => void;
	children?: ReactNode;
	className?: string;
}

export function CardRow({ label, description, value, onPress, children, className }: CardRowProps) {
	const rowClassName = cn(
		'flex-row items-center justify-between',
		description ? 'py-3' : 'h-14',
		className,
	);

	const content = (
		<>
			<View className="flex-1 pr-3">
				<Text className="font-pretendard-semibold text-gray900 text-[16px]">{label}</Text>
				{description && (
					<Text className="font-pretendard-regular text-gray500 text-[12px] mt-0.5 leading-[18px]">
						{description}
					</Text>
				)}
			</View>
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
				accessibilityLabel={description ? `${label}. ${description}` : label}
				style={({ pressed }) => (pressed ? { opacity: 0.5 } : undefined)}
			>
				{content}
			</Pressable>
		);
	}

	return <View className={rowClassName}>{content}</View>;
}
