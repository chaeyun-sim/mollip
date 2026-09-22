import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, Text } from 'react-native';
import { cn } from '@/src/lib/cn';
import { Indicator } from './Indicator';

export type ButtonTone = 'brand' | 'inverse' | 'danger' | 'gray' | 'white';
export type ButtonVariant = 'solid' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonHaptic = 'light' | 'medium';

interface ButtonProps extends Omit<PressableProps, 'children' | 'onPress'> {
	children: ReactNode;
	onPress: () => void;
	accessibilityLabel: string;
	variant?: ButtonVariant;
	/** solid는 배경 톤, ghost는 텍스트·아이콘 톤으로 적용된다 */
	tone?: ButtonTone;
	/** 기본 large(기존 크기와 동일). 좁은 공간·보조 액션엔 small/medium. */
	size?: ButtonSize;
	loading?: boolean;
	icon?: keyof typeof Ionicons.glyphMap;
	/** solid 기본 true. 라벨 너비만큼만 쓸 때 false */
	block?: boolean;
	haptic?: ButtonHaptic | false;
}

// 토스 TDS 버튼의 4단계 크기 체계(small/medium/large/xlarge)를 참고해 이 앱의 실제 사용처(큰 CTA 위주)에 맞게
// 3단계로 조정했다 — large가 기존 디자인과 동일해 기존 호출부는 변경 없이 그대로 동작한다.
const SIZE_STYLES: Record<
	ButtonSize,
	{
		solidClassName: string;
		ghostClassName: string;
		solidIconSize: number;
		ghostIconSize: number;
		solidTextClassName: string;
		ghostTextClassName: string;
	}
> = {
	small: {
		solidClassName: 'min-h-9 rounded-lg py-2 px-4',
		ghostClassName: 'py-2',
		solidIconSize: 15,
		ghostIconSize: 13,
		solidTextClassName: 'text-[13px] font-pretendard-semibold',
		ghostTextClassName: 'text-xs font-pretendard-regular',
	},
	medium: {
		solidClassName: 'min-h-10 rounded-xl py-3 px-5',
		ghostClassName: 'py-3',
		solidIconSize: 16,
		ghostIconSize: 14,
		solidTextClassName: 'text-[14px] font-pretendard-semibold',
		ghostTextClassName: 'text-[13px] font-pretendard-regular',
	},
	large: {
		solidClassName: 'min-h-11 rounded-2xl py-[14px] px-6',
		ghostClassName: 'py-4',
		solidIconSize: 18,
		ghostIconSize: 15,
		solidTextClassName: 'text-[16px] font-pretendard-semibold',
		ghostTextClassName: 'text-sm font-pretendard-regular',
	},
};

const triggerHaptic = (haptic: ButtonHaptic | false | undefined) => {
	if (haptic === 'medium') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		return;
	}

	if (haptic === 'light') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}
};

const pressOpacity = (pressed: boolean, isDisabled: boolean, ghost: boolean) => {
	if (isDisabled) return ghost ? 0.4 : 1;
	if (!pressed) return 1;
	return ghost ? 0.6 : 0.85;
};

const GHOST_TEXT_COLORS: Record<ButtonTone, string> = {
	brand: 'primaryDark',
	inverse: 'secondary',
	danger: 'error',
	gray: 'gray600',
	white: 'white',
};

const GHOST_TEXT_COLOR_CLASS_NAMES: Record<ButtonTone, string> = {
	brand: 'text-primary-dark',
	inverse: 'text-secondary',
	danger: 'text-error',
	gray: 'text-gray600',
	white: 'text-white',
};

/** 라벨 CTA. 행·원형 아이콘은 IconButton / 도메인 행 컴포넌트를 쓴다. */
export function Button({
	children,
	onPress,
	accessibilityLabel,
	variant = 'solid',
	tone = 'brand',
	size = 'large',
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
	const sizeStyle = SIZE_STYLES[size];

	const handlePress = () => {
		if (isDisabled) return;
		triggerHaptic(haptic);
		onPress();
	};

	let label: ReactNode;
	if (loading) {
		label = <Indicator size="small" color={isGhost ? GHOST_TEXT_COLORS[tone] : 'white'} />;
	} else if (isGhost) {
		const ghostTextClassName = cn(sizeStyle.ghostTextClassName, GHOST_TEXT_COLOR_CLASS_NAMES[tone]);
		label = (
			<>
				{icon && (
					<Ionicons name={icon} size={sizeStyle.ghostIconSize} color={GHOST_TEXT_COLORS[tone]} />
				)}
				<Text className={ghostTextClassName} style={{ color: GHOST_TEXT_COLORS[tone] }}>
					{children}
				</Text>
			</>
		);
	} else {
		// gray 톤은 밝은 배경(bg-gray300)이라 흰 글자가 아니라 어두운 텍스트여야 읽힌다
		const solidTextColorClassName = tone === 'gray' ? 'text-secondary' : 'text-white';
		label = (
			<>
				{icon && (
					<Ionicons
						name={icon}
						size={sizeStyle.solidIconSize}
						className={solidTextColorClassName}
					/>
				)}
				<Text className={cn(sizeStyle.solidTextClassName, solidTextColorClassName)}>
					{children}
				</Text>
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
				isGhost ? cn('gap-2', sizeStyle.ghostClassName) : sizeStyle.solidClassName,
				{
					'w-full': isBlock,
					'bg-primary-dark': !isGhost && tone === 'brand' && !isDisabled,
					'bg-secondary': !isGhost && tone === 'inverse' && !isDisabled,
					'bg-error': !isGhost && tone === 'danger' && !isDisabled,
					'bg-gray300': (!isGhost && isDisabled) || (!isGhost && tone === 'gray'),
					'text-primary-dark': isGhost && tone === 'brand',
				},
				className,
			)}
			style={(state) => [
				typeof style === 'function' ? style(state) : style,
				{ opacity: pressOpacity(state.pressed, isDisabled, isGhost) },
			]}
		>
			{label}
		</Pressable>
	);
}
