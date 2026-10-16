import { Text } from 'react-native';

import { ScreenHeader } from '@/src/components/layout/ScreenHeader';

interface RecordStepHeaderProps {
	step: number;
	/** 전체 단계 수 — 전시 고르기를 거치면 3(고르기·감상·확인), 이미 전시가 정해졌으면 2(감상·확인) */
	total?: number;
	onBack?: () => void;
}

/** 기록하기 공용 헤더 — 뒤로 · 기록하기 · n/N */
export function RecordStepHeader({ step, total = 3, onBack }: RecordStepHeaderProps) {
	return (
		<ScreenHeader>
			<ScreenHeader.Back onPress={onBack} />
			<ScreenHeader.Center>기록하기</ScreenHeader.Center>
			<ScreenHeader.Right className="top-0 bottom-0 justify-center">
				<Text
					accessibilityLabel={`${total}단계 중 ${step}단계`}
					className="text-gray500 text-[13px] font-pretendard-semibold tracking-[1px]"
				>
					{`${step}/${total}`}
				</Text>
			</ScreenHeader.Right>
		</ScreenHeader>
	);
}
