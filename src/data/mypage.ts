import type { DescriptionLength, FontSize, VoiceSpeed } from '@/src/store/settingsStore';

export const APP_VERSION = '1.0.2';

export const FONT_SIZE_OPTIONS: { value: FontSize; labelKey: string }[] = [
	{ value: 'small', labelKey: 'narration.font_small' },
	{ value: 'medium', labelKey: 'narration.font_medium' },
	{ value: 'large', labelKey: 'narration.font_large' },
];

export const SPEED_OPTIONS: { value: VoiceSpeed; label: string }[] = [
	{ value: 0.7, label: '0.7x' },
	{ value: 1.0, label: '1.0x' },
	{ value: 1.25, label: '1.25x' },
	{ value: 1.5, label: '1.5x' },
];

export const DESCRIPTION_LENGTH_OPTIONS: { value: DescriptionLength; labelKey: string }[] = [
	{ value: 0.5, labelKey: 'narration.length_short' },
	{ value: 1, labelKey: 'narration.length_normal' },
	{ value: 1.5, labelKey: 'narration.length_long' },
	{ value: 2, labelKey: 'narration.length_very_long' },
];
