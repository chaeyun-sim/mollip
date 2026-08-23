import type { FontSize, VoiceSpeed } from '@/src/store/settingsStore';

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

export const SCRAP_TILES = [
	{
		key: 'exhibitions',
		label: '관심 있는 전시',
		icon: 'bookmark-outline' as const,
		route: '/settings/bookmark/exhibition' as const,
	},
	{
		key: 'audio',
		label: '다시 듣고 싶은 오디오',
		icon: 'headset-outline' as const,
		route: '/settings/bookmark/audio' as const,
	},
] as const;
