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
	const reduceMotion = useReducedMotion();

	return (
		<View
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel={`질문 ${total}개 중 ${index + 1}번째`}
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
				{`질문 ${index + 1} / ${total}`}
			</Text>
		</View>
	);
}
