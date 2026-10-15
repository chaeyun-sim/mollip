import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface RecordQuestionProps {
	title: string;
	/** 질문 아래의 보조 한 줄 — 꼭 필요할 때만 */
	description?: string;
	children: ReactNode;
	className?: string;
}

/** 기록하기 감상 단계의 한 질문 — 큰 질문 문장과 그 답을 고르는 컨트롤 */
export function RecordQuestion({ title, description, children, className }: RecordQuestionProps) {
	return (
		<View className={cn('mt-8', className)}>
			<Text
				accessibilityRole="header"
				className="font-pretendard-bold text-2xl leading-[34px] text-gray900"
			>
				{title}
			</Text>
			{description && (
				<Text className="mt-1.5 font-pretendard-regular text-[14px] text-gray600">
					{description}
				</Text>
			)}
			<View className="mt-6">{children}</View>
		</View>
	);
}
