import { Text, View } from 'react-native';

import { ScalePressable } from '@/src/components/common/ScalePressable';
import { cn } from '@/src/lib/cn';

interface HomeIndexRowProps {
	/** 왼쪽 열에 크게 놓이는 값 (D-day 또는 순번) */
	lead: string;
	/** true면 lead를 강조색으로 — 마감 D-day 전용 */
	isLeadAccent?: boolean;
	title: string;
	subtitle: string;
	/** 마지막 행은 아래 구분선을 그리지 않는다 */
	isLast: boolean;
	accessibilityLabel: string;
	onPress: () => void;
}

/** 도록 목차형 행 — 큰 lead 열 + 제목·부제, 헤어라인 구분 */
export function HomeIndexRow({
	lead,
	isLeadAccent = false,
	title,
	subtitle,
	isLast,
	accessibilityLabel,
	onPress,
}: HomeIndexRowProps) {
	return (
		<ScalePressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			className={cn('flex-row items-start py-4', {
				'border-b-[0.5px] border-gray300': !isLast,
			})}
		>
			<Text
				className={cn('w-[64px] text-[20px] leading-[26px] font-pretendard-semibold', {
					'text-brand': isLeadAccent,
					'text-gray500': !isLeadAccent,
				})}
			>
				{lead}
			</Text>
			<View className="flex-1">
				<Text
					numberOfLines={2}
					className="text-gray900 text-[15px] leading-[21px] font-pretendard-semibold"
				>
					{title}
				</Text>
				<Text numberOfLines={1} className="mt-1 text-gray600 text-[12.5px] font-pretendard-regular">
					{subtitle}
				</Text>
			</View>
		</ScalePressable>
	);
}
