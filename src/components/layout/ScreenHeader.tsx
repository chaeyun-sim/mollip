import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { cn } from '../../lib/cn';

interface SlotProps {
	children?: ReactNode;
	className?: string;
	style?: ViewStyle;
}

function ScreenHeader({ children, className, style }: SlotProps) {
	return (
		<View
			className={cn('relative flex-row items-center py-4', className)}
			style={style}
		>
			{children}
		</View>
	);
}

function Left({ children, className, style }: SlotProps) {
	return (
		<View className={cn('flex-1 items-start', className)} style={style}>
			{children}
		</View>
	);
}

function Center({ children, className, style }: SlotProps) {
	return (
		<View
			className={cn(
				'absolute left-1/2 -translate-x-1/2 flex-1 items-center mt-1',
				className,
			)}
			style={style}
		>
			{children}
		</View>
	);
}

function Right({ children, className, style }: SlotProps) {
	return (
		<View className={cn('flex-1 items-end', className)} style={style}>
			{children}
		</View>
	);
}

function Back({ onPress }: { onPress?: () => void }) {
	const router = useRouter();
	return (
		<Pressable
			onPress={onPress ?? (() => router.back())}
			hitSlop={8}
			accessibilityLabel='뒤로 가기'
			accessibilityRole='button'
			style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
		>
			<Ionicons name='arrow-back' size={24} color='#4da3ff' />
		</Pressable>
	);
}

ScreenHeader.Left = Left;
ScreenHeader.Center = Center;
ScreenHeader.Right = Right;
ScreenHeader.Back = Back;

export { ScreenHeader };
