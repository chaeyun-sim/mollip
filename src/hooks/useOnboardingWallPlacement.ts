import { useCallback, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { normalizeOnboardingGenres } from '@/src/utils/onboardingWallGenres';
import { ONBOARDING_WALL_PIECES, type OnboardingWallPiece } from '@/src/data/onboardingWallPieces';

export const useOnboardingWallPlacement = () => {
	const [placements, setPlacements] = useState<(OnboardingWallPiece | null)[]>(Array(5).fill(null));
	const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
	const [announcement, setAnnouncement] = useState('');
	const genres = useMemo(
		() => normalizeOnboardingGenres(placements.flatMap((piece) => (piece ? [piece.genre] : []))),
		[placements],
	);
	const count = placements.filter(Boolean).length;
	const announce = useCallback((message: string) => {
		setAnnouncement(message);
		AccessibilityInfo.announceForAccessibility(message);
	}, []);
	const initialize = useCallback((stored: string[]) => {
		const pieces = normalizeOnboardingGenres(stored)
			.slice(0, 5)
			.map(
				(genre) =>
					ONBOARDING_WALL_PIECES.find((piece) => piece.genre === genre && piece.representative) ??
					null,
			);
		setPlacements(Array.from({ length: 5 }, (_, index) => pieces[index] ?? null));
		setSelectedFrame(null);
		setAnnouncement('');
	}, []);
	const place = useCallback(
		(piece: OnboardingWallPiece, target: number, source: number | null = null) => {
			if (source === target) return;
			if (source === null && placements.some((item) => item?.id === piece.id)) return;
			const next = [...placements];
			if (source !== null) next[source] = next[target];
			next[target] = piece;
			setPlacements(next);
			setSelectedFrame(null);
			announce(
				`${piece.genre === '현대미술' ? '현대 미술' : piece.genre} 작품을 걸었어요. ${next.filter(Boolean).length}/5`,
			);
		},
		[placements, announce],
	);
	const selectFrame = useCallback(
		(index: number) => {
			if (placements[index]) {
				setSelectedFrame((current) => (current === index ? null : index));
				setAnnouncement('');
			}
		},
		[placements],
	);
	const cancel = useCallback(() => {
		setSelectedFrame(null);
		setAnnouncement('');
	}, []);
	const unplace = useCallback(
		(piece: OnboardingWallPiece) => {
			const index = placements.findIndex((item) => item?.id === piece.id);
			if (index < 0) return;
			const next = [...placements];
			next[index] = null;
			setPlacements(next);
			setSelectedFrame((current) => (current === index ? null : current));
		},
		[placements],
	);
	const unplaceFrame = useCallback(
		(index: number) => {
			if (!placements[index]) return;
			const next = [...placements];
			next[index] = null;
			setPlacements(next);
			setSelectedFrame((current) => (current === index ? null : current));
		},
		[placements],
	);

	return {
		placements,
		selectedFrame,
		announcement,
		count,
		genres,
		initialize,
		place,
		selectFrame,
		cancel,
		unplace,
		unplaceFrame,
		announce,
	};
};
