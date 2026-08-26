import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, Text, TextStyle, View, ViewStyle } from 'react-native';
import { cn } from '../../lib/cn';
import { LinearGradient } from 'expo-linear-gradient';

interface SlotProps {
	children?: ReactNode;
	className?: string;
	style?: ViewStyle;
}

interface LogoProps {
	className?: string;
	fontSize?: number;
	textStyle?: TextStyle;
}

function ScreenHeader({ children, className, style }: SlotProps) {
	return (
		<View className={cn('relative flex-row items-center py-4', className)} style={style}>
			{children}
		</View>
	);
}

function Logo({ className, fontSize = 24, textStyle }: LogoProps) {
	return (
		<View className={cn('flex-row items-start', className)}>
			<Text className="text-primary font-hahmlet-semibold" style={{ fontSize, ...textStyle }}>
				moll
			</Text>

			<View className="relative">
				<Text className="text-primary font-hahmlet-semibold" style={{ fontSize, ...textStyle }}>
					ı
				</Text>

				<View
					className="absolute left-1/2"
					style={{
						transform: [{ translateX: -(fontSize / 8) }],
						height: fontSize / 4,
						width: fontSize / 4,
						top: fontSize / 4.5,
					}}
				>
					<LinearGradient
						colors={['#F7DCCB', '#EBCFD5', '#D4C5DD', '#CDD3E1']}
						locations={[0, 0.35, 0.7, 1]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{
							width: '100%',
							height: '100%',
							borderRadius: 1,
						}}
					/>
				</View>
			</View>

			<Text className="text-primary font-hahmlet-semibold" style={{ fontSize, ...textStyle }}>
				p
			</Text>
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
			className={cn('absolute left-1/2 -translate-x-1/2 flex-1 items-center mt-1', className)}
			style={style}
		>
			{typeof children === 'string' ? (
				<Text className="text-[17px] text-primary font-pretendard-semibold">{children}</Text>
			) : (
				children
			)}
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

function Back({
	onPress,
	color = 'default',
	className,
}: {
	onPress?: () => void;
	color?: 'default' | 'muted' | 'white-90' | 'white';
	className?: string;
}) {
	const router = useRouter();
	const colorClass =
		color === 'muted'
			? 'text-tertiary'
			: color === 'white-90'
				? 'text-white/90'
				: color === 'white'
					? 'text-white'
					: 'text-primary';

	return (
		<Pressable
			onPress={onPress ?? (() => router.back())}
			hitSlop={8}
			accessibilityLabel="뒤로 가기"
			accessibilityRole="button"
			style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
		>
			<Ionicons name="arrow-back" size={24} className={cn(colorClass, className)} />
		</Pressable>
	);
}

ScreenHeader.Left = Left;
ScreenHeader.Center = Center;
ScreenHeader.Right = Right;
ScreenHeader.Back = Back;
ScreenHeader.Logo = Logo;

export { ScreenHeader };
