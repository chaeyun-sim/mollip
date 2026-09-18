import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface ExhibitionInfoRowProps {
	icon?: ReactNode;
	label: string;
	isLast?: boolean;
	children: ReactNode;
	onPress?: () => void;
}

export function ExhibitionInfoRow({
	icon,
	label,
	isLast,
	children,
	onPress,
}: ExhibitionInfoRowProps) {
	return (
		<View
			className={cn('flex-row items-center gap-3 py-3.5', !isLast && 'border-b border-gray300')}
		>
			<View className="flex-1 pt-1">
				<Text className="text-gray500 text-[11px] font-pretendard-medium tracking-wider uppercase">
					{label}
				</Text>
				<View className="flex-row items-center gap-1.5">
					<Text className="text-gray900 text-[14px] font-pretendard-regular leading-5 mt-0.5">
						{children}
					</Text>
					{icon && (
						<Pressable
							onPress={onPress}
							hitSlop={8}
							accessibilityLabel="주소 복사"
							accessibilityRole="button"
							style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
							className="mt-0.5"
						>
							{icon}
						</Pressable>
					)}
				</View>
			</View>
		</View>
	);
}
