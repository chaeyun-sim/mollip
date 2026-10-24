import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { Divider } from '@/src/components/common/Divider';
import { cn } from '@/src/lib/cn';
import { Indicator } from './Indicator';

export type ListFooterBorderType = 'full' | 'none';

interface ListFooterProps extends Omit<PressableProps, 'children'> {
	title?: string;
	borderType?: ListFooterBorderType;
	icon?: keyof typeof Ionicons.glyphMap;
	loading?: boolean;
}

export function ListFooter({
	title = '더 보기',
	borderType = 'full',
	icon = 'chevron-down',
	loading = false,
	disabled = false,
	className,
	style,
	...rest
}: ListFooterProps) {
	const isDisabled = disabled || loading;

	return (
		<View className={cn('w-full', className)}>
			{borderType === 'full' && <Divider tone="subtle" />}
			<Pressable
				{...rest}
				disabled={isDisabled}
				accessibilityRole="button"
				accessibilityState={{ disabled: isDisabled, busy: loading }}
				className="min-h-14 flex-row items-center justify-center gap-1.5 px-6"
				style={(state) => [
					typeof style === 'function' ? style(state) : style,
					{ opacity: state.pressed && !isDisabled ? 0.55 : 1 },
				]}
			>
				{loading ? (
					<Indicator color="gray600" />
				) : (
					<>
						<Text className="text-[14px] font-pretendard-medium text-gray600">{title}</Text>
						<Ionicons name={icon} size={16} className="text-gray600" />
					</>
				)}
			</Pressable>
		</View>
	);
}
