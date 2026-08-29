import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';

export interface CardRowProps {
	label: string;
	value?: string;
	onPress?: () => void;
	children?: React.ReactNode;
	className?: string;
	url?: string;
}

export function CardRow({
	label,
	value,
	onPress,
	children,
	className,
	url
}: CardRowProps) {
	const inner = (pressed: boolean) => (
		<View
			className={cn(
				'flex-row items-center justify-between h-[44px] border-[rgba(28,25,23,0.06)]',
				pressed ? 'opacity-50' : 'opacity-100',
				className,
			)}
		>
			<Text className="font-pretendard-semibold text-gray900 text-[14px]">{label}</Text>
			{children ?? (
				<View className="flex-row items-center gap-1">
					{value ? (
						<Text className="font-pretendard-regular text-[#B0A89E] text-[13px]">{value}</Text>
					) : null}
					{onPress ? <Ionicons name="chevron-forward" size={18} className="text-gray500" /> : null}
					{url ? <Ionicons name="open-outline" size={18} className="text-gray900" /> : null}
				</View>
			)}
		</View>
	);

	if (onPress) {
		return (
			<Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
				{({ pressed }) => inner(pressed)}
			</Pressable>
		);
	}
	return inner(false);
}
