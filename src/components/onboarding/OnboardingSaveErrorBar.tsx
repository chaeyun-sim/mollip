import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();

	const retryRef = useRef<View>(null);

	useEffect(() => {
		AccessibilityInfo.announceForAccessibility(t('onboarding.save_failed_announce'));
		const node = retryRef.current;
		if (!node) return;
		const tag = findNodeHandle(node);
		if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
	}, [t]);

	return (
		<View
			accessibilityRole="alert"
			accessibilityLiveRegion="assertive"
			className="mb-3 gap-2.5 rounded-2xl bg-white border-[0.5px] border-gray300 px-4 py-3"
		>
			<Text className="text-gray900 text-[13px] font-pretendard-medium">
				{t('onboarding.save_failed_body')}
			</Text>
			<View className="flex-row gap-3">
				<Pressable
					ref={retryRef}
					onPress={onRetry}
					disabled={busy}
					accessibilityRole="button"
					accessibilityLabel={t('common.retry')}
					accessibilityState={{ busy, disabled: busy }}
					className={cn(
						'flex-1 min-h-11 items-center justify-center rounded-full',
						busy ? 'bg-gray400' : 'bg-brand',
					)}
				>
					<Text
						className={cn('text-[14px] font-pretendard-semibold', busy ? 'text-ink' : 'text-white')}
					>
						{t('common.retry')}
					</Text>
				</Pressable>
				<Pressable
					onPress={onSkipSave}
					disabled={busy}
					accessibilityRole="button"
					accessibilityLabel={t('onboarding.start_without_saving')}
					accessibilityState={{ busy, disabled: busy }}
					className="flex-1 min-h-11 items-center justify-center rounded-full border-[0.5px] border-gray300"
				>
					<Text
						className={cn(
							'text-[14px] font-pretendard-semibold',
							busy ? 'text-gray400' : 'text-gray900',
						)}
					>
						{t('onboarding.start_without_saving')}
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
