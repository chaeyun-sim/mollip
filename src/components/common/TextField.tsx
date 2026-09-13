import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

export type TextFieldTone = 'light' | 'dark';
export type TextFieldVariant = 'field' | 'area' | 'plain';

interface TextFieldProps extends TextInputProps {
	/** field: 한 줄 박스 / area: 여러 줄 박스 / plain: 부모 크롬 안 입력만 */
	variant?: TextFieldVariant;
	tone?: TextFieldTone;
	error?: boolean;
}

const PLACEHOLDER: Record<TextFieldTone, string> = {
	light: colors.gray500,
	dark: colors.gray700,
};

function resolveBorder(error: boolean, tone: TextFieldTone) {
	if (error) return 'border-error';
	if (tone === 'dark') return 'border-divider-dark';
	return 'border-[rgba(28,25,23,0.1)]';
}

function chromeClassName(
	variant: TextFieldVariant,
	tone: TextFieldTone,
	error: boolean,
	isArea: boolean,
) {
	if (variant === 'plain') {
		return tone === 'dark' ? 'flex-1 text-on-dark' : 'flex-1 text-gray900';
	}

	const border = resolveBorder(error, tone);

	if (tone === 'dark') {
		return cn(
			'px-4 bg-gray900 text-on-dark border',
			border,
			isArea ? 'rounded-lg py-3 text-[15px] min-h-[80px]' : 'rounded-lg h-[52px] text-base py-0',
		);
	}

	return cn(
		'px-4 text-gray900 border',
		border,
		isArea ? 'rounded-2xl py-4 text-[15px] min-h-[120px]' : 'rounded-2xl h-[52px] text-[15px]',
	);
}

/** 입력 프리미티브. iOS 세로 정렬(lineHeight 0)과 라이트/다크 토큰을 맞춘다. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
	{
		variant = 'field',
		tone = 'light',
		error = false,
		className,
		style,
		placeholderTextColor,
		multiline,
		...props
	},
	ref,
) {
	const isArea = variant === 'area';
	const isSingleLine = !isArea && !multiline;

	return (
		<TextInput
			ref={ref}
			placeholderTextColor={placeholderTextColor ?? PLACEHOLDER[tone]}
			textAlignVertical={isArea || multiline ? 'top' : 'center'}
			multiline={isArea ? true : multiline}
			{...props}
			className={cn(
				'font-pretendard-regular',
				chromeClassName(variant, tone, error, isArea),
				className,
			)}
			style={[isSingleLine ? { lineHeight: 0 } : null, style]}
		/>
	);
});
