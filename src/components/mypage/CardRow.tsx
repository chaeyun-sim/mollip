import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

export interface CardRowProps {
	label: string;
	description?: string;
	value?: string;
	icon?: keyof typeof Ionicons.glyphMap;
	/** 프리미엄 전용 등 아직 열리지 않은 항목 — 우측에 자물쇠 아이콘 표시, 흐리게 처리 */
	disabled?: boolean;
	onPress?: () => void;
	children?: ReactNode;
	className?: string;
}

export function CardRow({
	label,
	description,
	value,
	icon,
	disabled,
	onPress,
	children,
	className,
}: CardRowProps) {
	const rowClassName = cn(
		'flex-row items-center justify-between',
		description ? 'py-3' : 'h-16',
		disabled && 'opacity-40',
		className,
	);

	const content = (
		<>
			{icon && (
				<View className="w-8 h-8 rounded-full bg-bg-tonal items-center justify-center mr-3">
					<Ionicons name={icon} size={16} className="text-gray700" />
				</View>
			)}
			<View className="flex-1 pr-3">
				<Text className="font-pretendard-medium text-gray900 text-base" numberOfLines={1}>
					{label}
				</Text>
				{description && (
					<Text
						className="font-pretendard-regular text-gray500 text-[12px] mt-0.5 leading-[18px]"
						numberOfLines={2}
					>
						{description}
					</Text>
				)}
			</View>
			{children ?? (
				<View className="flex-row items-center gap-1 max-w-[45%]">
					{value && (
						<Text
							className="flex-1 font-pretendard-regular text-[#B0A89E] text-[14px] text-right"
							numberOfLines={1}
						>
							{value}
						</Text>
					)}
				</View>
			)}
		</>
	);

	if (onPress && !disabled) {
		return (
			<Pressable
				onPress={disabled ? undefined : onPress}
				className={rowClassName}
				accessibilityRole="button"
				accessibilityLabel={description ? `${label}. ${description}` : label}
				style={({ pressed }) => (pressed ? { opacity: 0.5 } : undefined)}
			>
				{content}
				{disabled ? (
					<Ionicons name="lock-closed" size={16} className="text-gray500" />
				) : (
					<Ionicons name="chevron-forward" size={18} className="text-gray500" />
				)}
			</Pressable>
		);
	}

	return <View className={rowClassName}>{content}</View>;
}
