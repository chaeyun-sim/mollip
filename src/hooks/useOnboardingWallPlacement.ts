import { useCallback, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';

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
	// 액자 슬롯 위치를 보존해야 하므로 빈 슬롯도 ''로 채워 길이 5 고정 배열을 유지한다 —
	// flatMap으로 압축하면 중간이 빈 배치(예: 3·5번 슬롯만 채움)가 저장 후 앞으로 당겨져 복원된다.
	const pieceIds = useMemo(() => placements.map((piece) => piece?.id ?? ''), [placements]);
	const count = placements.filter(Boolean).length;
	const announce = useCallback((message: string) => {
		setAnnouncement(message);
		AccessibilityInfo.announceForAccessibility(message);
	}, []);
	const initialize = useCallback((storedGenres: string[], storedPieceIds: string[] = []) => {
		// 빈 슬롯은 '' — 인덱스를 그대로 유지해 원래 걸었던 액자 위치에 복원한다(압축 금지).
		const hasStoredPlacement = storedPieceIds.some((id) => id);
		const pieces = hasStoredPlacement
			? storedPieceIds
					.slice(0, 5)
					.map((id) =>
						id ? (ONBOARDING_WALL_PIECES.find((piece) => piece.id === id) ?? null) : null,
					)
			: normalizeOnboardingGenres(storedGenres)
					.slice(0, 5)
					.map(
						(genre) =>
							ONBOARDING_WALL_PIECES.find(
								(piece) => piece.genre === genre && piece.representative,
							) ?? null,
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
			void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
		pieceIds,
		initialize,
		place,
		selectFrame,
		cancel,
		unplace,
		unplaceFrame,
		announce,
	};
};
