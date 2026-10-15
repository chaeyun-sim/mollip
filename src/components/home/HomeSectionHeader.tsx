import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

/** rem 기반 px-6(≈21px)과 무관하게 폭 계산과 맞도록 24로 고정 */
export const HOME_SIDE_PADDING = 24;

interface HomeSectionHeaderProps {
	/** 도록 목차처럼 붙는 섹션 번호 (1 → "01") */
	index: number;
	title?: string;
	/** 제목 아래 한 줄 설명 */
	subtitle?: string;
	/** 번호 줄 우측 액션 (예: 전체 보기) */
	right?: ReactNode;
	className?: string;
}

/** 홈 섹션 공통 헤더 — 섹션 번호 + 헤어라인 룰 + Hahmlet 제목 */
export function HomeSectionHeader({
	index,
	title,
	subtitle,
	right,
	className,
}: HomeSectionHeaderProps) {
	return (
		<View className={cn('mb-5', className)} style={{ paddingHorizontal: HOME_SIDE_PADDING }}>
			<View className="flex-row items-center gap-3">
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 4,
					}}
				>
					<Text className="text-gray900 text-[12px] font-pretendard-semibold tracking-[1px]">
						{String(index).padStart(2, '0')}
					</Text>
					{title && (
						<Text className="text-gray900 text-[12px] font-pretendard-semibold tracking-[1px]">
							{title}
						</Text>
					)}
				</View>
				<View className="flex-1 h-px bg-gray900" />
				{right}
			</View>
			{subtitle && (
				<Text className="mt-0.5 text-gray600 text-[13px] font-pretendard-regular">{subtitle}</Text>
			)}
		</View>
	);
}
