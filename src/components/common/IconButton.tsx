import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

export type IconButtonTone = 'brand' | 'inverse';
export type IconButtonVariant = 'solid' | 'ghost' | 'bare';
export type IconButtonHaptic = 'light' | 'medium';

interface IconButtonProps extends Omit<PressableProps, 'children' | 'onPress'> {
	onPress: () => void;
	accessibilityLabel: string;
	icon?: keyof typeof Ionicons.glyphMap;
	children?: ReactNode;
	variant?: IconButtonVariant;
	tone?: IconButtonTone;
	size?: 'md' | 'lg';
	loading?: boolean;
	elevated?: boolean;
	haptic?: IconButtonHaptic | false;
}

const ELEVATED_SHADOW = {
	shadowColor: '#000',
	shadowOffset: { width: 0, height: 4 },
	shadowOpacity: 0.3,
	shadowRadius: 8,
	elevation: 6,
} as const;

function resolveIconSize(variant: IconButtonVariant, size: 'md' | 'lg') {
	if (variant === 'bare') return 26;
	if (size === 'lg') return 30;
	if (variant === 'ghost') return 22;
	return 26;
}

function triggerHaptic(haptic: IconButtonHaptic | false | undefined) {
	if (haptic === 'medium') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		return;
	}

	if (haptic === 'light') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}
}

/** 원형·아이콘 전용 버튼. 라벨 CTA는 Button을 쓴다. */
export function IconButton({
	onPress,
	accessibilityLabel,
	icon,
	children,
	variant = 'solid',
	tone = 'brand',
	size = 'md',
	disabled = false,
	loading = false,
	elevated = false,
	haptic = false,
	className,
	style,
	hitSlop,
	...rest
}: IconButtonProps) {
	const isDisabled = disabled || loading;
	const isBare = variant === 'bare';
	const isLg = size === 'lg';
	const iconSize = resolveIconSize(variant, size);

	function handlePress() {
		if (isDisabled) return;
		triggerHaptic(haptic);
		onPress();
	}

	function renderGlyph() {
		if (loading) {
			return <ActivityIndicator size="small" color={colors.white} />;
		}

		if (children) return children;

		if (icon) {
			return (
				<Ionicons
					name={icon}
					size={iconSize}
					className={isBare ? 'text-gray600' : 'text-white'}
				/>
			);
		}

		return null;
	}

	return (
		<Pressable
			{...rest}
			onPress={handlePress}
			disabled={isDisabled}
			hitSlop={hitSlop ?? (isBare ? 8 : undefined)}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled: isDisabled }}
			className={cn(
				'items-center justify-center',
				{
					'w-16 h-16 rounded-full': !isBare && isLg,
					'w-14 h-14 rounded-full': !isBare && !isLg,
					'bg-primary': !isBare && variant === 'solid' && tone === 'brand' && !isDisabled,
					'bg-secondary': !isBare && variant === 'solid' && tone === 'inverse' && !isDisabled,
					'bg-divider-dark': !isBare && variant === 'solid' && isDisabled,
					'bg-white/10 border border-white/15': !isBare && variant === 'ghost',
				},
				className,
			)}
			style={(state) => [
				elevated && !isBare ? ELEVATED_SHADOW : null,
				typeof style === 'function' ? style(state) : style,
				isBare
					? { opacity: state.pressed && !isDisabled ? 0.7 : 1 }
					: { transform: [{ scale: state.pressed && !isDisabled ? 0.93 : 1 }] },
			]}
		>
			{renderGlyph()}
		</Pressable>
	);
}
