import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface SettingsPillGroupProps<T extends string | number> {
	options: { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	labelFontSize?: (value: T) => number;
}

export function SettingsPillGroup<T extends string | number>({
	options,
	value,
	onChange,
	labelFontSize,
}: SettingsPillGroupProps<T>) {
	return (
		<View
			className='flex-row gap-1 rounded-2xl p-1'
			style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}
		>
			{options.map((opt) => {
				const selected = value === opt.value;
				return (
					<Pressable
						key={String(opt.value)}
						className='px-3 rounded-xl items-center justify-center'
						style={({ pressed }) => ({
							height: 32,
							backgroundColor: selected ? '#1C1917' : 'transparent',
							transform: [{ scale: pressed ? 0.95 : 1 }],
							...(selected
								? {
										shadowColor: '#1C1917',
										shadowOpacity: 0.25,
										shadowRadius: 6,
										shadowOffset: { width: 0, height: 2 },
										elevation: 3,
									}
								: null),
						})}
						accessibilityRole='button'
						accessibilityState={{ selected }}
						accessibilityLabel={opt.label}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onChange(opt.value);
						}}
					>
						<Text
							className={cn(
								'font-pretendard-semibold',
								selected ? 'text-white' : 'text-gray-400',
							)}
							style={{ fontSize: labelFontSize ? labelFontSize(opt.value) : 12 }}
						>
							{opt.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
