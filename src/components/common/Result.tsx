import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { cn } from '@/src/lib/cn';

export type ResultTone = 'neutral' | 'success' | 'danger';

interface ResultProps {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	tone?: ResultTone;
	/** 성공/완료 화면처럼 아이콘에 원형 배경을 두르고 싶을 때 */
	iconBackground?: boolean;
	iconSize?: number;
	/** 몰입 모드처럼 어두운 배경 위에 올릴 때 — 기본 색상은 밝은 배경 전제라 어두운 배경에서 텍스트가 묻힌다 */
	dark?: boolean;
	className?: string;
}

const TONE_ICON_CLASSNAME: Record<ResultTone, string> = {
	neutral: 'text-secondary',
	success: 'text-primary',
	danger: 'text-error',
};

const TONE_ICON_CLASSNAME_DARK: Record<ResultTone, string> = {
	neutral: 'text-gray300',
	success: 'text-primary',
	danger: 'text-error',
};

const TONE_ICON_BACKGROUND_CLASSNAME: Record<ResultTone, string> = {
	neutral: 'bg-bg-tonal',
	success: 'bg-bg-tonal',
	danger: 'bg-error/10',
};

/**
 * 토스 TDS Result를 참고한 빈 상태·에러·완료 화면 공용 컴포넌트.
 * 아이콘 + 제목 + (선택) 설명 + (선택) 액션 버튼 하나로 구성된다.
 */
export function Result({
	icon,
	title,
	description,
	actionLabel,
	onAction,
	tone = 'neutral',
	iconBackground = false,
	className,
	iconSize = 44,
	dark = false,
}: ResultProps) {
	const iconClassName = dark ? TONE_ICON_CLASSNAME_DARK[tone] : TONE_ICON_CLASSNAME[tone];

	return (
		<View className={cn('flex-1 items-center justify-center px-8', className)}>
			{iconBackground ? (
				<View
					className={cn(
						'w-16 h-16 rounded-full items-center justify-center mb-1',
						TONE_ICON_BACKGROUND_CLASSNAME[tone],
					)}
				>
					<Ionicons name={icon} size={28} className={iconClassName} />
				</View>
			) : (
				<Ionicons name={icon} size={iconSize ?? 44} className={iconClassName} />
			)}
			<View className="gap-3 mt-5">
				<Text
					className={cn(
						'font-pretendard-medium text-[17px] text-center',
						dark ? 'text-on-dark' : 'text-secondary',
					)}
				>
					{title}
				</Text>
				{description && (
					<Text
						className={cn(
							'font-pretendard-regular text-[15px] text-center leading-5',
							dark ? 'text-white/60' : 'text-gray700',
						)}
					>
						{description}
					</Text>
				)}
			</View>
			{actionLabel && onAction && (
				<Button
					onPress={onAction}
					variant="solid"
					tone="brand"
					accessibilityLabel={actionLabel}
					className="mt-6 w-fit"
					size="medium"
				>
					{actionLabel}
				</Button>
			)}
		</View>
	);
}
