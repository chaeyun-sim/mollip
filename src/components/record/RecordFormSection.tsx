import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface RecordFormSectionProps {
	label: string;
	/** 라벨 오른쪽의 작은 보조 정보 (선택 표시·글자 수 등) */
	hint?: ReactNode;
	/** 라벨 오른쪽에 둘 행동 (예: AI로 다듬기) */
	action?: ReactNode;
	children: ReactNode;
	className?: string;
}

/** 기록하기 폼의 한 칸 — 라벨 줄 + 입력. 모든 칸이 같은 간격·라벨 모양을 갖게 한다 */
export function RecordFormSection({
	label,
	hint,
	action,
	children,
	className,
}: RecordFormSectionProps) {
	return (
		<View className={cn('mt-7', className)}>
			<View className="mb-2.5 flex-row items-center justify-between">
				<View className="flex-row items-baseline gap-1.5">
					<Text className="font-pretendard-semibold text-[15px] text-gray900">{label}</Text>
					{hint && <Text className="font-pretendard-regular text-[12px] text-gray500">{hint}</Text>}
				</View>
				{action}
			</View>
			{children}
		</View>
	);
}
