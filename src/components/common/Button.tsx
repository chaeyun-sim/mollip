import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, Text } from 'react-native';

import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

export type ButtonTone = 'brand' | 'inverse';
export type ButtonVariant = 'solid' | 'ghost';
export type ButtonHaptic = 'light' | 'medium';

interface ButtonProps extends Omit<PressableProps, 'children' | 'onPress'> {
	children: ReactNode;
	onPress: () => void;
	accessibilityLabel: string;
	variant?: ButtonVariant;
	/** brand: 라이트 배경 + primary-dark / inverse: 다크 배경 + secondary */
	tone?: ButtonTone;
	loading?: boolean;
	icon?: keyof typeof Ionicons.glyphMap;
	/** solid 기본 true. 라벨 너비만큼만 쓸 때 false */
	block?: boolean;
	haptic?: ButtonHaptic | false;
}

function triggerHaptic(haptic: ButtonHaptic | false | undefined) {
	if (haptic === 'medium') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		return;
	}

	if (haptic === 'light') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}
}

function pressOpacity(pressed: boolean, isDisabled: boolean, ghost: boolean) {
	if (isDisabled) return ghost ? 0.4 : 1;
	if (!pressed) return 1;
	return ghost ? 0.6 : 0.85;
}

/** 라벨 CTA. 행·원형 아이콘은 IconButton / 도메인 행 컴포넌트를 쓴다. */
export function Button({
	children,
	onPress,
	accessibilityLabel,
	variant = 'solid',
	tone = 'brand',
	disabled = false,
	loading = false,
	icon,
	block,
	haptic = false,
	className,
	style,
	...rest
}: ButtonProps) {
	const isDisabled = disabled || loading;
	const isGhost = variant === 'ghost';
	const isBlock = block ?? !isGhost;

	function handlePress() {
		if (isDisabled) return;
		triggerHaptic(haptic);
		onPress();
	}

	function renderLabel() {
		if (loading) {
			return <ActivityIndicator size="small" color={colors.white} />;
		}

		if (isGhost) {
			return (
				<>
					{icon && <Ionicons name={icon} size={15} className="text-gray600" />}
					<Text className="text-sm font-pretendard-regular text-gray600">{children}</Text>
				</>
			);
		}

		return (
			<>
				{icon && <Ionicons name={icon} size={18} className="text-white" />}
				<Text className="text-[16px] font-pretendard-semibold text-white">{children}</Text>
			</>
		);
	}

	return (
		<Pressable
			{...rest}
			onPress={handlePress}
			disabled={isDisabled}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled: isDisabled }}
			className={cn(
				'flex-row items-center justify-center',
				isGhost ? 'gap-2 py-4' : 'min-h-11 rounded-2xl py-[14px] px-6',
				{
					'w-full': isBlock,
					'bg-primary-dark': !isGhost && tone === 'brand' && !isDisabled,
					'bg-secondary': !isGhost && tone === 'inverse' && !isDisabled,
					'bg-gray400': !isGhost && isDisabled,
				},
				className,
			)}
			style={(state) => [
				typeof style === 'function' ? style(state) : style,
				{ opacity: pressOpacity(state.pressed, isDisabled, isGhost) },
			]}
		>
			{renderLabel()}
		</Pressable>
	);
}
