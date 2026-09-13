import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, Text, View } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { Screen } from '@/src/components/layout/Screen';
import type { OnboardingWallSelection } from '@/src/hooks/useOnboardingWallFlow';

interface OnboardingWallConfirmProps {
	selections: (OnboardingWallSelection | undefined)[];
	onRequestChange: (trayIndex: number) => void;
	onRestart: () => void;
	onConfirm: () => void;
	confirmDisabled?: boolean;
	confirmLabel?: string;
	title?: string;
	/** 바꾸기로 변경된 프레임이 있을 때만 안내를 발화한다 (AC-7) */
	changeAnnouncement: string | null;
	changedTrayIndex: number | null;
	/** 저장 실패 시 CTA 위에 얹는 OnboardingSaveErrorBar (AC-5) */
	errorSlot?: ReactNode;
}

/** 저장 전 선택 3~5개를 다시 보여주는 확인 화면 — 프레임 탭으로 바꾸기, 전체 재시작 지원 (AC-3, AC-4). */
export function OnboardingWallConfirm({
	selections,
	onRequestChange,
	onRestart,
	onConfirm,
	confirmDisabled = false,
	confirmLabel = '이 취향으로 시작하기',
	title = '당신의 첫 전시 벽',
	changeAnnouncement,
	changedTrayIndex,
	errorSlot,
}: OnboardingWallConfirmProps) {
	const frameRefs = useRef<(View | null)[]>([]);
	const filled = selections.filter((s): s is OnboardingWallSelection => Boolean(s));
	const genreSummary = filled.map((s) => s.piece.genre).join(' · ');

	useEffect(() => {
		if (!changeAnnouncement || changedTrayIndex === null) return;
		AccessibilityInfo.announceForAccessibility(changeAnnouncement);
		const node = frameRefs.current[changedTrayIndex];
		if (!node) return;
		const tag = findNodeHandle(node);
		if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
	}, [changeAnnouncement, changedTrayIndex]);

	return (
		<>
			<View className="flex-1 pt-4 gap-6">
				<View className="gap-2">
					<Text className="text-gray900 text-[22px] leading-[30px] font-hahmlet-semibold">
						{title}
					</Text>
					<Text className="text-gray700 text-[13px] font-pretendard-regular">
						{genreSummary}를 바탕으로 전시를 찾아볼게요.
					</Text>
				</View>

				<View className="flex-row flex-wrap gap-2.5">
					{selections.map((selection, index) => {
						if (!selection) return null;

						return (
							<Pressable
								key={index}
								ref={(node) => {
									frameRefs.current[index] = node;
								}}
								onPress={() => onRequestChange(index)}
								accessibilityRole="button"
								accessibilityLabel={`${selection.piece.genre}, 선택됨, 탭하여 바꾸기`}
								accessibilityState={{ selected: true }}
								className="w-[90px] h-[90px] rounded-2xl border-2 border-primary-dark items-center justify-center px-1"
								style={({ pressed }) => ({
									backgroundColor: selection.piece.color,
									opacity: pressed ? 0.8 : 1,
								})}
							>
								<Text
									numberOfLines={1}
									className="text-gray900 text-[12px] font-pretendard-semibold"
								>
									{selection.piece.genre}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<Pressable
					onPress={onRestart}
					accessibilityRole="button"
					accessibilityLabel="벽을 다시 꾸미기"
					className="self-start min-h-11 justify-center"
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<Text className="text-gray700 text-[13px] font-pretendard-medium underline">
						벽을 다시 꾸미기
					</Text>
				</Pressable>
			</View>

			<Screen.BottomAbsolute className="px-6">
				{errorSlot}
				<Button onPress={onConfirm} disabled={confirmDisabled} accessibilityLabel={confirmLabel}>
					{confirmLabel}
				</Button>
			</Screen.BottomAbsolute>
		</>
	);
}
