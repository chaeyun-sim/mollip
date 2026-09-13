import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, Text, View } from 'react-native';

import { OnboardingSkipAction } from '@/src/components/onboarding/OnboardingSkipAction';
import type { OnboardingWallSelection } from '@/src/hooks/useOnboardingWallFlow';
import { cn } from '@/src/lib/cn';

const TRAY_COUNT = 5;

interface OnboardingWallProgressProps {
	selections: (OnboardingWallSelection | undefined)[];
	canCompleteEarly: boolean;
	onCompleteEarly: () => void;
	onRequestChange: (trayIndex: number) => void;
	/** 온보딩 전용 — 설정 재편집(AC-6)에서는 생략해 헤더 스킵을 숨긴다 */
	onSkip?: () => void;
	/** 바꾸기로 변경된 프레임이 있을 때만 안내를 발화한다 (AC-7) */
	changeAnnouncement: string | null;
	changedTrayIndex: number | null;
}

/** 완성 중인 전시 벽 — N/5 진행, 채워진/빈 프레임, 조기 완료 CTA, 헤더 스킵 (AC-2, AC-3). */
export function OnboardingWallProgress({
	selections,
	canCompleteEarly,
	onCompleteEarly,
	onRequestChange,
	onSkip,
	changeAnnouncement,
	changedTrayIndex,
}: OnboardingWallProgressProps) {
	const frameRefs = useRef<(View | null)[]>([]);

	useEffect(() => {
		if (!changeAnnouncement || changedTrayIndex === null) return;
		AccessibilityInfo.announceForAccessibility(changeAnnouncement);
		const node = frameRefs.current[changedTrayIndex];
		if (!node) return;
		const tag = findNodeHandle(node);
		if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
	}, [changeAnnouncement, changedTrayIndex]);

	return (
		<View className="gap-3 pb-3">
			<View className="flex-row items-center justify-between">
				<Text className="text-gray700 text-[13px] font-pretendard-semibold">
					{selections.filter(Boolean).length} / {TRAY_COUNT}
				</Text>
				{onSkip && <OnboardingSkipAction onPress={onSkip} />}
			</View>

			<View className="flex-row gap-2">
				{Array.from({ length: TRAY_COUNT }).map((_, index) => {
					const selection = selections[index];

					if (!selection) {
						return (
							<View
								key={index}
								className="flex-1 h-16 rounded-xl border-[1.5px] border-dashed border-primary/40"
							/>
						);
					}

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
							className="flex-1 h-16 rounded-xl border-2 border-primary-dark items-center justify-center px-1"
							style={({ pressed }) => ({ backgroundColor: selection.piece.color, opacity: pressed ? 0.8 : 1 })}
						>
							<Text
								numberOfLines={1}
								className="text-gray900 text-[10px] font-pretendard-semibold"
							>
								{selection.piece.genre}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{canCompleteEarly && (
				<Pressable
					onPress={onCompleteEarly}
					accessibilityRole="button"
					accessibilityLabel="이만큼으로 시작하기"
					className={cn('self-center min-h-11 px-5 items-center justify-center rounded-full bg-white border-[0.5px] border-gray300')}
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Text className="text-gray900 text-[13px] font-pretendard-semibold">
						이만큼으로 시작하기
					</Text>
				</Pressable>
			)}
		</View>
	);
}
