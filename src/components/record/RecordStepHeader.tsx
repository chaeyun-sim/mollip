import { Text } from 'react-native';

import { ScreenHeader } from '@/src/components/layout/ScreenHeader';

const TOTAL_STEPS = 3;

interface RecordStepHeaderProps {
	step: 1 | 2 | 3;
	onBack?: () => void;
}

/** 기록하기 공용 헤더 — 뒤로 · 기록하기 · n/3 */
export function RecordStepHeader({ step, onBack }: RecordStepHeaderProps) {
	return (
		<ScreenHeader>
			<ScreenHeader.Back onPress={onBack} />
			<ScreenHeader.Center>기록하기</ScreenHeader.Center>
			<ScreenHeader.Right className="top-0 bottom-0 justify-center">
				<Text
					accessibilityLabel={`${TOTAL_STEPS}단계 중 ${step}단계`}
					className="text-gray500 text-[13px] font-pretendard-semibold tracking-[1px]"
				>
					{`${step}/${TOTAL_STEPS}`}
				</Text>
			</ScreenHeader.Right>
		</ScreenHeader>
	);
}
