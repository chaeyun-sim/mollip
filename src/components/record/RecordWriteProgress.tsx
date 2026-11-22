import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { ProgressBar } from '@/src/components/common/ProgressBar';

interface RecordWriteProgressProps {
	/** 지금 보고 있는 질문의 0부터 시작하는 순서 */
	index: number;
	total: number;
}

/** 기록하기 2단계 안의 질문 진행 — 헤더의 2/3과 구분되도록 "질문 n / N"으로 쓴다 */
export function RecordWriteProgress({ index, total }: RecordWriteProgressProps) {
	const { t } = useTranslation();

	const reduceMotion = useReducedMotion();

	return (
		<View
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel={t('diary.record_question_a11y', { index: index + 1, total })}
			className="flex-row items-center gap-3 pb-1"
		>
			<View className="flex-1">
				<ProgressBar
					progress={(index + 1) / total}
					colorClassName="bg-gray700"
					trackClassName="bg-divider/50"
					animate={!reduceMotion}
				/>
			</View>
			<Text className="font-pretendard-medium text-[12px] text-gray600">
				{t('diary.record_question_progress', { index: index + 1, total })}
			</Text>
		</View>
	);
}
