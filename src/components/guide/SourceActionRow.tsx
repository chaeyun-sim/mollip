import { Ionicons } from '@expo/vector-icons';
import { Pressable, type PressableProps, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface SourceActionRowProps extends Omit<PressableProps, 'children' | 'onPress'> {
	title: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
	onPress: () => void;
	variant?: 'filled' | 'outlined';
}

/** 작품 입력 진입점의 카메라/갤러리 행. 이 화면에서만 쓰이므로 common이 아니다. */
export function SourceActionRow({
	title,
	description,
	icon,
	onPress,
	variant = 'filled',
	disabled = false,
	accessibilityLabel,
	className,
	...rest
}: SourceActionRowProps) {
	const isFilled = variant === 'filled';

	return (
		<Pressable
			{...rest}
			onPress={onPress}
			disabled={Boolean(disabled)}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? title}
			accessibilityState={{ disabled: Boolean(disabled) }}
			className={cn('rounded-2xl overflow-hidden', className)}
			style={({ pressed }) => ({ opacity: pressed && !disabled ? 0.85 : 1 })}
		>
			<View
				className={cn(
					'flex-row items-center gap-4 px-6 py-5',
					isFilled ? 'bg-secondary' : 'bg-white/8 border-[0.5px] border-white/10',
				)}
			>
				<View
					className={cn(
						'w-10 h-10 rounded-xl items-center justify-center',
						isFilled ? 'bg-white/20' : 'bg-white/10',
					)}
				>
					<Ionicons name={icon} size={22} className={isFilled ? 'text-white' : 'text-on-dark'} />
				</View>
				<View className="flex-1">
					<Text
						className={cn(
							'text-base font-pretendard-semibold',
							isFilled ? 'text-white' : 'text-on-dark',
						)}
					>
						{title}
					</Text>
					<Text
						className={cn(
							'text-xs mt-0.5',
							isFilled ? 'text-white/60' : 'font-pretendard-regular text-gray600',
						)}
					>
						{description}
					</Text>
				</View>
				<Ionicons
					name="chevron-forward"
					size={18}
					className={isFilled ? 'text-white/50' : 'text-gray700'}
				/>
			</View>
		</Pressable>
	);
}
