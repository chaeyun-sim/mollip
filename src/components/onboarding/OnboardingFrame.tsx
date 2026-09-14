import { useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import Svg, { Defs, ClipPath, Ellipse, Rect, Image as SvgImage, G } from 'react-native-svg';

import { ONBOARDING_WALL_FRAMES } from '@/src/data/onboardingWallFrames';
import type { OnboardingWallPiece } from '@/src/data/onboardingWallPieces';

interface OnboardingFrameProps {
	index: number;
	scale: number;
	piece: OnboardingWallPiece | null;
	selected: boolean;
	target: boolean;
}

const COVER_ZOOM = 1.08;

const coverRect = (
	x: number,
	y: number,
	width: number,
	height: number,
	sourceWidth: number,
	sourceHeight: number,
	focus: [number, number],
) => {
	const scale = Math.max(width / sourceWidth, height / sourceHeight) * COVER_ZOOM;
	const w = sourceWidth * scale;
	const h = sourceHeight * scale;
	return {
		x: x + Math.max(width - w, Math.min(0, width / 2 - focus[0] * w)),
		y: y + Math.max(height - h, Math.min(0, height / 2 - focus[1] * h)),
		width: w,
		height: h,
	};
};

export function OnboardingFrame({ index, scale, piece, selected, target }: OnboardingFrameProps) {
	const frame = ONBOARDING_WALL_FRAMES[index];
	const [x, y, width, height] = frame.mask;
	const imageRect = useMemo(() => {
		if (!piece) return { x, y, width, height };
		const source = Image.resolveAssetSource(piece.image);
		return coverRect(x, y, width, height, source?.width || 1, source?.height || 1, piece.focus);
	}, [piece, x, y, width, height]);

	return (
		<View
			className="relative"
			style={{ width: frame.width * scale, height: frame.height * scale }}
			pointerEvents="none"
		>
			{(selected || target) && (
				<View className="absolute -inset-0.5 border border-dashed border-gray700" />
			)}
			<Svg width="100%" height="100%" viewBox={`0 0 ${frame.width} ${frame.height}`}>
				<Defs>
					<ClipPath id={`frame-mask-${index}`}>
						{frame.oval ? (
							<Ellipse cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} />
						) : (
							<Rect x={x} y={y} width={width} height={height} />
						)}
					</ClipPath>
				</Defs>
				<G clipPath={`url(#frame-mask-${index})`}>
					<Rect x={x} y={y} width={width} height={height} fill="transparent" />
					{piece && <SvgImage href={piece.image} {...imageRect} preserveAspectRatio="none" />}
				</G>
				<SvgImage href={frame.image} x={0} y={0} width={frame.width} height={frame.height} />
			</Svg>
			{piece === null && (
				<View className="absolute inset-0 items-center justify-center">
					<Text className="font-pretendard-regular text-lg text-gray700">+</Text>
				</View>
			)}
			{/* {target && (
				<Text className="absolute bottom-0 left-0 right-0 bg-gray100 text-center font-pretendard-medium text-[10px] text-gray900">
					{piece ? '교체' : '여기에 걸기'}
				</Text>
			)} */}
		</View>
	);
}
