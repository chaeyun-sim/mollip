import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface VisitSectionHeaderProps {
	label: string;
	/** 머리말 오른쪽에 둘 정보 (별점·개수 등) */
	right?: ReactNode;
	/** 머리말 아래 가는 선 — 바로 아래 내용이 이어질 때 켠다 */
	divider?: boolean;
	className?: string;
}

/** 기록 상세의 영역 머리말 — 보라색 짧은 선 + 자간 넓은 작은 제목. 관람 노트·들은 작품·채팅이 같은 모양을 쓴다 */
export function VisitSectionHeader({
	label,
	right,
	divider = false,
	className,
}: VisitSectionHeaderProps) {
	return (
		<View
			className={cn(
				'flex-row items-center justify-between',
				divider && 'border-b-[0.5px] border-divider pb-3',
				className,
			)}
		>
			<View className="flex-row items-center gap-2">
				<View className="h-[2px] w-4 bg-editorial" />
				<Text
					accessibilityRole="header"
					className="font-pretendard-semibold text-[11px] tracking-[1.5px] text-gray600"
				>
					{label}
				</Text>
			</View>
			{right}
		</View>
	);
}
