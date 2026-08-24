import { Text, View } from 'react-native';

interface SectionTitleProps {
	title: string;
	/** 제목 위 영문 레이블 */
	eyebrow?: string;
	/** 제목 아래 보조 설명 */
	subtitle?: string;
}

/** 섹션 제목. eyebrow(위)·subtitle(아래)은 선택적으로 렌더링한다. */
export function SectionTitle({ title, eyebrow, subtitle }: SectionTitleProps) {
	return (
		<View className='mb-4'>
			{eyebrow && (
				<Text className='text-[11px] text-muted mb-1 font-pretendard-semibold leading-[1.6px]'>
					{eyebrow}
				</Text>
			)}
			<Text className='text-primary text-[20px] font-hahmlet-semibold'>
				{title}
			</Text>
			{subtitle && (
				<Text className='text-[13px] mt-1 leading-[19px] font-pretendard-regular text-secondary'>
					{subtitle}
				</Text>
			)}
		</View>
	);
}
