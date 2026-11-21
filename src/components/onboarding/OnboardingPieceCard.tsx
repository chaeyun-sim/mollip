import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { OnboardingDraggable } from '@/src/components/onboarding/OnboardingDraggable';
import { cn } from '@/src/lib/cn';
import type { OnboardingWallPiece } from '@/src/data/onboardingWallPieces';

interface OnboardingPieceCardProps {
	piece: OnboardingWallPiece;
	placed: boolean;
	disabled: boolean;
	onSelect: (piece: OnboardingWallPiece, x: number, y: number) => void;
	onDrag: (
		piece: OnboardingWallPiece,
		source: number | null,
		x: number,
		y: number,
		phase: 'start' | 'move' | 'end' | 'cancel',
	) => void;
}

export function OnboardingPieceCard({
	piece,
	placed,
	disabled,
	onSelect,
	onDrag,
}: OnboardingPieceCardProps) {
	const { t, i18n } = useTranslation();
	const isEn = i18n.language === 'en';

	const handlePress = useCallback(
		(x: number, y: number) => onSelect(piece, x, y),
		[piece, onSelect],
	);
	const handleDrag = useCallback(
		(x: number, y: number, phase: 'start' | 'move' | 'end' | 'cancel') =>
			onDrag(piece, null, x, y, phase),
		[piece, onDrag],
	);
	const pieceLabel = isEn ? piece.labelEn : piece.label;
	// 카드 폭(88px)에 맞게 현대미술은 짧은 라벨을 쓴다
	const localizedGenre = isEn
		? t(`recommendations.labels.${piece.genre}`, { defaultValue: piece.genre })
		: piece.genre;
	const genreLabel =
		piece.genre === '현대미술' ? t('onboarding.genre_contemporary_short') : localizedGenre;

	return (
		<View className="w-[88px]">
			<OnboardingDraggable
				testID={`tray-${piece.id}`}
				label={placed ? t('onboarding.piece_placed_a11y', { label: pieceLabel }) : pieceLabel}
				disabled={disabled}
				draggable={!placed}
				onPress={handlePress}
				onDrag={handleDrag}
			>
				<View
					className={cn('relative h-[88px] w-[88px] overflow-hidden rounded-xl bg-gray100', {
						'opacity-50': placed,
					})}
				>
					<Image
						source={piece.image}
						className="h-full w-full"
						resizeMode="cover"
						accessible={false}
					/>
					{placed && (
						<View className="absolute inset-0 items-center justify-center bg-gray900/45">
							<Text className="font-pretendard-semibold text-2xl text-white">✓</Text>
						</View>
					)}
				</View>
				<Text className="pt-1 text-center font-pretendard-medium text-xs text-gray900">
					{genreLabel}
				</Text>
			</OnboardingDraggable>
		</View>
	);
}
