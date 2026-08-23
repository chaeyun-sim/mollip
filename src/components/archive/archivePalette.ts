import { colors } from '@/src/constants/colors';

/** Archive hub — warm scrapbook palette (no system blue). */

export const ARCHIVE_INK = colors.primary;
export const ARCHIVE_MUTED = colors.secondary;
export const ARCHIVE_SUBTLE = colors.tertiary;

/** Per-metric accent (receipt zone dots · card stack hues) */
export const ARCHIVE_STAT_ACCENTS = {
	visitDays: '#9B8AB8',
	listened: '#6B9B7A',
	saved: '#C4846A',
} as const;

/** Rotated tint when no artwork thumbnail */
export const ARCHIVE_CARD_TINTS = [
	'#E8E0F4',
	'#F5E6D8',
	'#D4E8DC',
	'#F0D4E4',
	'#E5DFD3',
] as const;

export function archiveTintForKey(key: string): string {
	let hash = 0;
	for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % 997;
	return ARCHIVE_CARD_TINTS[hash % ARCHIVE_CARD_TINTS.length];
}
