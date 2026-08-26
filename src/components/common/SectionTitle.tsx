import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface SectionTitleProps {
	title: ReactNode;
	/** 제목 위 영문 레이블 */
	eyebrow?: string;
	/** 제목 아래 보조 설명 */
	subtitle?: string;
	/** 제목 우측에 배치할 요소 (예: 더보기 버튼) */
	right?: ReactNode;
}

/** 섹션 제목. eyebrow(위)·subtitle(아래)은 선택적으로 렌더링한다. */
export function SectionTitle({ title, eyebrow, subtitle, right }: SectionTitleProps) {
	return (
		<View className="mb-4">
			<View className="flex-row items-end justify-between">
				<View className="flex-1 pr-2">
					{eyebrow && (
						<Text className="text-[11px] text-muted mb-1 font-pretendard-semibold leading-[1.6px]">
							{eyebrow}
						</Text>
					)}
					{typeof title === 'string' ? <Text className="text-primary text-[18px] font-pretendard-semibold">{title}</Text> : title}
				</View>
				{right}
			</View>
			{subtitle && (
				<Text className="text-[13px] leading-[19px] font-pretendard-regular text-secondary">
					{subtitle}
				</Text>
			)}
		</View>
	);
}
