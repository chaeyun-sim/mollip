import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

export interface PillSelectorProps<T extends string | number> {
	options: { value: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
	labelSize?: (v: T) => number;
}

export function PillSelector<T extends string | number>({
	options,
	value,
	onChange,
	labelSize,
}: PillSelectorProps<T>) {
	return (
		<View className="flex-row gap-1.5 items-center absolute right-0">
			{options.map((opt) => {
				const selected = value === opt.value;
				return (
					<Pressable
						key={String(opt.value)}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onChange(opt.value);
						}}
						accessibilityRole="button"
						accessibilityState={{ selected }}
						accessibilityLabel={String(opt.label)}
						style={({ pressed }) => ({
							transform: [{ scale: pressed ? 0.93 : 1 }],
						})}
						className={cn(
							'px-3 py-1.5 rounded-full',
							selected
								? 'bg-primary border-2 border-primary'
								: 'border border-[rgba(28,25,23,0.15)]',
						)}
					>
						<Text
							style={{ fontSize: labelSize ? labelSize(opt.value) : 12 }}
							className={cn(
								selected
									? 'font-pretendard-medium text-white'
									: 'font-pretendard-regular text-muted',
							)}
						>
							{opt.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
