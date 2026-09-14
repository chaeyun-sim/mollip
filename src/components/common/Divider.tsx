import { View, type ViewProps } from 'react-native';

import { cn } from '@/src/lib/cn';

export type DividerVariant = 'full' | 'inset' | 'section';
export type DividerTone = 'default' | 'dark' | 'subtle' | 'inverse';

interface DividerProps extends ViewProps {
	variant?: DividerVariant;
	tone?: DividerTone;
}

const VARIANT_CLASS_NAMES: Record<DividerVariant, string> = {
	full: 'h-hairline w-full',
	inset: 'h-hairline mx-6',
	section: 'h-4 w-full',
};

const TONE_CLASS_NAMES: Record<DividerTone, string> = {
	default: 'bg-divider',
	dark: 'bg-divider-dark',
	subtle: 'bg-black/[0.06]',
	inverse: 'bg-white/10',
};

export function Divider({ variant = 'full', tone = 'default', className, ...rest }: DividerProps) {
	return (
		<View
			{...rest}
			className={cn(VARIANT_CLASS_NAMES[variant], TONE_CLASS_NAMES[tone], className)}
		/>
	);
}
