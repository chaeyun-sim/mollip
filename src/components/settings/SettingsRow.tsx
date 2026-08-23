import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';

interface SettingsRowProps {
	label: string;
	icon?: keyof typeof Ionicons.glyphMap;
	children?: React.ReactNode;
	border?: boolean;
	onPress?: () => void;
	danger?: boolean;
}

export function SettingsRow({
	label,
	icon,
	children,
	border = true,
	onPress,
	danger = false,
}: SettingsRowProps) {
	const content = (pressed: boolean) => (
		<View
			className={cn(
				'flex-row items-center justify-between px-4 gap-3 min-h-[52px]',
				border && 'border-b border-black/5',
				pressed ? 'opacity-60' : 'opacity-100',
			)}
		>
			<View className='flex-row items-center gap-3 flex-1'>
				{icon ? (
					<Ionicons name={icon} size={14} color={danger ? colors.error : colors.secondary} />
				) : null}
				<Text
					className={cn(
						'font-pretendard-regular text-[15px]',
						danger ? 'text-red-500' : 'text-gray-900',
					)}
				>
					{label}
				</Text>
			</View>
			{children}
		</View>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					onPress();
				}}
				accessibilityRole='button'
				accessibilityLabel={label}
			>
				{({ pressed }) => content(pressed)}
			</Pressable>
		);
	}
	return content(false);
}
