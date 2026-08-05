import { cn } from '@/src/lib/cn';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

interface SettingsPillGroupProps<T extends string | number> {
	options: { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	labelFontSize?: (value: T) => number;
	/** When true, each option shares equal width (e.g. archive tab switch). */
	equalWidth?: boolean;
}

export function SettingsPillGroup<T extends string | number>({
	options,
	value,
	onChange,
	labelFontSize,
	equalWidth = false,
}: SettingsPillGroupProps<T>) {
	return (
		<View
			className={cn(
				'flex-row gap-1 rounded-2xl p-1 bg-[#1c19170f]',
				equalWidth ? 'w-full' : null,
			)}
		>
			{options.map((opt) => {
				const selected = value === opt.value;
				const fontSize = labelFontSize ? labelFontSize(opt.value) : 12;
				return (
					<Pressable
						key={String(opt.value)}
						className='px-3 rounded-xl items-center justify-center'
						style={({ pressed }) => ({
							height: 32,
							...(equalWidth ? { flex: 1, flexBasis: 0 } : null),
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
						hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
						accessibilityRole='button'
						accessibilityState={{ selected }}
						accessibilityLabel={opt.label}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onChange(opt.value);
						}}
					>
						<Text
							numberOfLines={1}
							className={cn(
								'font-pretendard-semibold',
								selected ? 'text-white' : 'text-[#A8A29E]',
							)}
							style={{ fontSize }}
						>
							{opt.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
