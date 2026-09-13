import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface OnboardingSaveErrorBarProps {
	onRetry: () => void;
	onSkipSave: () => void;
	busy: boolean;
}

/** 저장 실패 시 확인 화면 위에 얹는 오류 바 — 즉시 알림 + 다시 시도로 포커스 이동 (AC-5, AC-7). */
export function OnboardingSaveErrorBar({ onRetry, onSkipSave, busy }: OnboardingSaveErrorBarProps) {
	const retryRef = useRef<View>(null);

	useEffect(() => {
		AccessibilityInfo.announceForAccessibility('저장에 실패했어요. 다시 시도해 주세요.');
		const node = retryRef.current;
		if (!node) return;
		const tag = findNodeHandle(node);
		if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
	}, []);

	return (
		<View
			accessibilityRole="alert"
			accessibilityLiveRegion="assertive"
			className="mb-3 gap-2.5 rounded-2xl bg-white border-[0.5px] border-gray300 px-4 py-3"
		>
			<Text className="text-gray900 text-[13px] font-pretendard-medium">
				저장에 실패했어요. 네트워크를 확인하고 다시 시도해 주세요.
			</Text>
			<View className="flex-row gap-3">
				<Pressable
					ref={retryRef}
					onPress={onRetry}
					disabled={busy}
					accessibilityRole="button"
					accessibilityLabel="다시 시도"
					accessibilityState={{ busy, disabled: busy }}
					className={cn(
						'flex-1 min-h-11 items-center justify-center rounded-full',
						busy ? 'bg-gray400' : 'bg-primary-dark',
					)}
				>
					<Text className="text-white text-[14px] font-pretendard-semibold">다시 시도</Text>
				</Pressable>
				<Pressable
					onPress={onSkipSave}
					disabled={busy}
					accessibilityRole="button"
					accessibilityLabel="취향 저장 없이 시작"
					accessibilityState={{ busy, disabled: busy }}
					className="flex-1 min-h-11 items-center justify-center rounded-full border-[0.5px] border-gray300"
				>
					<Text
						className={cn(
							'text-[14px] font-pretendard-semibold',
							busy ? 'text-gray400' : 'text-gray900',
						)}
					>
						취향 저장 없이 시작
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
