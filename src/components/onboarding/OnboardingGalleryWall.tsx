import { useTranslation } from 'react-i18next';
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingDraggable } from '@/src/components/onboarding/OnboardingDraggable';
import { OnboardingFrame } from '@/src/components/onboarding/OnboardingFrame';
import { OnboardingPieceCard } from '@/src/components/onboarding/OnboardingPieceCard';
import { ONBOARDING_WALL_CANVAS, ONBOARDING_WALL_FRAMES } from '@/src/data/onboardingWallFrames';
import { ONBOARDING_WALL_PIECES, type OnboardingWallPiece } from '@/src/data/onboardingWallPieces';
import { useOnboardingWallPlacement } from '@/src/hooks/useOnboardingWallPlacement';
import { cn } from '@/src/lib/cn';

interface OnboardingGalleryWallProps {
	wall: ReturnType<typeof useOnboardingWallPlacement>;
	busy: boolean;
	onConfirm: () => void;
	onResetPreferences?: () => void;
}

export function OnboardingGalleryWall({
	wall,
	busy,
	onConfirm,
	onResetPreferences,
}: OnboardingGalleryWallProps) {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();
	const dimensions = useWindowDimensions();
	const rootRef = useRef<View>(null);
	const canvasRef = useRef<View>(null);
	const scrollRef = useRef<ScrollView>(null);
	const viewportRef = useRef<View>(null);
	const scrollY = useRef(0);
	const edgeSince = useRef(0);
	const rootOrigin = useRef({ x: 0, y: 0 });
	const lastFrameTap = useRef({ index: -1, at: 0 });
	const [drag, setDrag] = useState<{ piece: OnboardingWallPiece; x: number; y: number } | null>(
		null,
	);
	const [target, setTarget] = useState<number | null>(null);
	const width = Math.min(dimensions.width - 32, 640);
	const scale = width / ONBOARDING_WALL_CANVAS.width;
	const canvasWidth = ONBOARDING_WALL_CANVAS.width * scale;
	const canvasHeight = ONBOARDING_WALL_CANVAS.height * scale;
	const handleTapPiece = useCallback(
		(piece: OnboardingWallPiece, x: number, y: number) => {
			if (wall.placements.some((item) => item?.id === piece.id)) {
				wall.unplace(piece);
				return;
			}
			canvasRef.current?.measureInWindow((cx, cy) => {
				let destination = wall.selectedFrame;
				if (destination === null) {
					const empty = ONBOARDING_WALL_FRAMES.map((frame, index) => ({
						index,
						distance:
							(cx + (frame.x + frame.width / 2) * scale - x) ** 2 +
							(cy + (frame.y + frame.height / 2) * scale - y) ** 2,
					}))
						.filter(({ index }) => wall.placements[index] === null)
						.sort((a, b) => a.distance - b.distance || a.index - b.index);
					destination = empty[0]?.index ?? null;
				}
				if (destination === null) {
					wall.announce(t('onboarding.select_frame_first'));
					return;
				}
				wall.place(piece, destination);
			});
		},
		[wall, scale, t],
	);
	const handleDrag = useCallback(
		(
			piece: OnboardingWallPiece,
			source: number | null,
			x: number,
			y: number,
			phase: 'start' | 'move' | 'end' | 'cancel',
		) => {
			if (busy) return;
			if (phase === 'cancel') {
				setDrag(null);
				setTarget(null);
				return;
			}
			if (phase === 'start') {
				wall.cancel();
				edgeSince.current = 0;
				rootRef.current?.measureInWindow((rx, ry) => {
					rootOrigin.current = { x: rx, y: ry };
				});
			}
			if (phase === 'start' || phase === 'move')
				setDrag({ piece, x: x - rootOrigin.current.x, y: y - rootOrigin.current.y });
			viewportRef.current?.measureInWindow((vx, vy, vw, vh) => {
				canvasRef.current?.measureInWindow((cx, cy) => {
					const candidates = ONBOARDING_WALL_FRAMES.map((frame, index) => {
						const left = Math.max(vx, cx, cx + frame.x * scale - 6);
						const top = Math.max(vy, cy, cy + frame.y * scale - 6);
						const right = Math.min(
							vx + vw,
							cx + canvasWidth,
							cx + (frame.x + frame.width) * scale + 6,
						);
						const bottom = Math.min(
							vy + vh,
							cy + canvasHeight,
							cy + (frame.y + frame.height) * scale + 6,
						);
						return {
							index,
							hit: x >= left && x <= right && y >= top && y <= bottom,
							distance:
								(x - cx - (frame.x + frame.width / 2) * scale) ** 2 +
								(y - cy - (frame.y + frame.height / 2) * scale) ** 2,
						};
					})
						.filter((candidate) => candidate.hit)
						.sort((a, b) => a.distance - b.distance || a.index - b.index);
					const nextTarget = candidates[0]?.index ?? null;
					if (phase === 'end') {
						if (nextTarget !== null) wall.place(piece, nextTarget, source);
						setDrag(null);
						setTarget(null);
					} else {
						setTarget(nextTarget);
						const atTop = y >= vy && y < vy + 32;
						const atBottom = y <= vy + vh && y > vy + vh - 32;
						if (atTop || atBottom) {
							if (edgeSince.current === 0) edgeSince.current = Date.now();
							if (Date.now() - edgeSince.current >= 350)
								scrollRef.current?.scrollTo({
									y: Math.max(0, Math.min(canvasHeight - vh, scrollY.current + (atTop ? -8 : 8))),
									animated: false,
								});
						} else {
							edgeSince.current = 0;
						}
					}
				});
			});
		},
		[busy, wall, scale, canvasWidth, canvasHeight],
	);
	const handleFramePress = useCallback(
		(index: number) => {
			const now = Date.now();
			if (
				wall.placements[index] &&
				lastFrameTap.current.index === index &&
				now - lastFrameTap.current.at < 320
			) {
				lastFrameTap.current = { index: -1, at: 0 };
				wall.unplaceFrame(index);
				return;
			}
			lastFrameTap.current = { index, at: now };
			wall.selectFrame(index);
		},
		[wall],
	);
	const handleConfirm = useCallback(() => {
		wall.cancel();
		onConfirm();
	}, [wall, onConfirm]);
	const canConfirmWall = wall.count >= 3 && !busy && drag === null;
	// 취향 수정 화면(초기화 버튼 있음)은 저장, 온보딩은 취향 강화하기로 넘어가므로 다음 문구를 쓴다
	const confirmLabel = onResetPreferences ? t('onboarding.save_preferences') : t('common.next');
	const busyLabel = onResetPreferences
		? t('onboarding.saving')
		: t('onboarding.saving_preferences');

	return (
		<View ref={rootRef} className="flex-1" testID="gallery-wall">
			<View ref={viewportRef} className="min-h-[160px] flex-1 overflow-hidden">
				<ScrollView
					ref={scrollRef}
					scrollEnabled={false}
					onScroll={(event) => {
						scrollY.current = event.nativeEvent.contentOffset.y;
					}}
					scrollEventThrottle={16}
					contentContainerClassName="items-center"
					showsVerticalScrollIndicator={false}
				>
					<View
						ref={canvasRef}
						collapsable={false}
						style={{ width: canvasWidth, height: canvasHeight }}
					>
						<Image
							source={require('../../../assets/images/onboarding/wall-bg.png')}
							className="absolute h-full w-full"
							resizeMode="cover"
							accessible={false}
						/>
						{ONBOARDING_WALL_FRAMES.map((frame, index) => (
							<View
								key={frame.id}
								className="absolute"
								style={{ left: frame.x * scale, top: frame.y * scale }}
							>
								<OnboardingDraggable
									testID={`frame-${index + 1}`}
									label={t('onboarding.frame_label', {
										number: index + 1,
										piece: wall.placements[index]?.label ?? t('onboarding.frame_empty'),
									})}
									selected={wall.selectedFrame === index}
									disabled={busy}
									draggable={wall.placements[index] !== null}
									onPress={() => handleFramePress(index)}
									onDrag={(x, y, phase) => {
										const piece = wall.placements[index];
										if (piece) handleDrag(piece, index, x, y, phase);
									}}
								>
									<OnboardingFrame
										index={index}
										scale={scale}
										piece={wall.placements[index]}
										selected={wall.selectedFrame === index}
										target={target === index}
									/>
								</OnboardingDraggable>
							</View>
						))}
					</View>
				</ScrollView>
			</View>
			<Text className="pt-8 pb-2 text-gray700 text-sm font-pretendard-regular">
				{wall.count < 3
					? `그림을 누르거나 드래그로 걸어보세요 · 최소 3개 중 ${3 - wall.count}개 더`
					: `${wall.count}/5개를 걸었어요 · 이대로 시작해도 좋아요`}
			</Text>
			<View className="rounded-xl bg-gray200 py-2">
				<ScrollView
					testID="artwork-tray"
					horizontal
					scrollEnabled={drag === null}
					showsHorizontalScrollIndicator={false}
				>
					<View className="flex-row">
						{Array.from({ length: Math.ceil(ONBOARDING_WALL_PIECES.length / 2) }, (_, column) => (
							<View key={ONBOARDING_WALL_PIECES[column * 2].id} className="mr-3">
								{ONBOARDING_WALL_PIECES.slice(column * 2, column * 2 + 2).map((piece, row) => (
									<View key={piece.id} className={cn({ 'mb-2': row === 0 })}>
										<OnboardingPieceCard
											piece={piece}
											placed={wall.placements.some((item) => item?.id === piece.id)}
											disabled={busy}
											onSelect={handleTapPiece}
											onDrag={handleDrag}
										/>
									</View>
								))}
							</View>
						))}
					</View>
				</ScrollView>
			</View>

			<View className="pt-3" style={{ paddingBottom: insets.bottom }}>
				<View className={cn(onResetPreferences && 'flex-row gap-2')}>
					{onResetPreferences && (
						<Pressable
							onPress={onResetPreferences}
							accessibilityRole="button"
							accessibilityLabel={t('onboarding.reset_preferences_a11y')}
							accessibilityState={{ disabled: busy, busy }}
							disabled={busy}
							className="min-h-[52px] flex-1 items-center justify-center rounded-[18px] border border-gray300 bg-white px-3"
						>
							<Text className="font-pretendard-semibold text-base text-gray800">
								{t('onboarding.reset')}
							</Text>
						</Pressable>
					)}
					<Pressable
						testID="wall-continue"
						accessibilityRole="button"
						accessibilityLabel={confirmLabel}
						accessibilityState={{ disabled: wall.count < 3 || busy || drag !== null, busy }}
						disabled={wall.count < 3 || busy || drag !== null}
						onPress={handleConfirm}
						className={cn(
							'min-h-[52px] items-center justify-center rounded-[18px]',
							onResetPreferences ? 'flex-1 px-3' : 'px-4',
							canConfirmWall ? 'bg-brand' : 'bg-gray400',
						)}
					>
						<Text
							numberOfLines={1}
							adjustsFontSizeToFit
							className={cn(
								'font-pretendard-semibold text-base',
								canConfirmWall ? 'text-white' : 'text-ink',
							)}
						>
							{busy ? busyLabel : confirmLabel}
						</Text>
					</Pressable>
				</View>
			</View>
			{ONBOARDING_WALL_PIECES.map((piece) => {
				const active = drag?.piece.id === piece.id;
				return (
					<View
						key={piece.id}
						pointerEvents="none"
						className="absolute z-50 h-[88px] w-[88px] overflow-hidden rounded-xl"
						style={{
							left: active && drag ? drag.x - 44 : -999,
							top: active && drag ? drag.y - 100 : -999,
							opacity: active ? 1 : 0,
						}}
					>
						<Image
							source={piece.image}
							className="h-full w-full"
							resizeMode="cover"
							accessible={false}
						/>
					</View>
				);
			})}
		</View>
	);
}
