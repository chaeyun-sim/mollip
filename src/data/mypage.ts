import type { DescriptionLength, FontSize, VoiceSpeed } from '@/src/store/settingsStore';

export const APP_VERSION = '1.0.0';

export const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
	{ value: 'small', label: '소' },
	{ value: 'medium', label: '중' },
	{ value: 'large', label: '대' },
];

export const SPEED_OPTIONS: { value: VoiceSpeed; label: string }[] = [
	{ value: 0.7, label: '0.7x' },
	{ value: 1.0, label: '1.0x' },
	{ value: 1.25, label: '1.25x' },
	{ value: 1.5, label: '1.5x' },
];

export const DESCRIPTION_LENGTH_OPTIONS: { value: DescriptionLength; label: string }[] = [
	{ value: 0.5, label: '짧게' },
	{ value: 1, label: '보통' },
	{ value: 1.5, label: '길게' },
	{ value: 2, label: '아주 길게' },
];
