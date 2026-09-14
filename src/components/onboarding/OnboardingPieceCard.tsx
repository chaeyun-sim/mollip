import { useCallback } from 'react';
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
	const handlePress = useCallback(
		(x: number, y: number) => onSelect(piece, x, y),
		[piece, onSelect],
	);
	const handleDrag = useCallback(
		(x: number, y: number, phase: 'start' | 'move' | 'end' | 'cancel') =>
			onDrag(piece, null, x, y, phase),
		[piece, onDrag],
	);
	return (
		<View className="w-[88px]">
			<OnboardingDraggable
				testID={`tray-${piece.id}`}
				label={`${piece.label}${placed ? ', 배치됨' : ''}`}
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
					{piece.genre === '현대미술' ? '현대 미술' : piece.genre}
				</Text>
			</OnboardingDraggable>
		</View>
	);
}
