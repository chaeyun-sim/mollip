import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

/** rem 기반 px-6(≈21px)과 무관하게 폭 계산과 맞도록 24로 고정 */
export const HOME_SIDE_PADDING = 24;

interface HomeSectionHeaderProps {
	title: string;
	/** 제목 아래 한 줄 설명 */
	subtitle?: string;
	/** 제목 우측 액션 (예: 전체 보기) */
	right?: ReactNode;
	className?: string;
}

/** 홈 하단 섹션 공통 헤더 — Hahmlet 제목 + Pretendard 부제 */
export function HomeSectionHeader({ title, subtitle, right, className }: HomeSectionHeaderProps) {
	return (
		<View
			className={cn('flex-row items-end justify-between mb-4', className)}
			style={{ paddingHorizontal: HOME_SIDE_PADDING }}
		>
			<View className="flex-1 pr-3">
				<Text className="text-gray900 text-[22px] leading-[30px] font-hahmlet-bold">{title}</Text>
				{subtitle && (
					<Text className="mt-0.5 text-gray600 text-[13px] font-pretendard-regular">
						{subtitle}
					</Text>
				)}
			</View>
			{right}
		</View>
	);
}
