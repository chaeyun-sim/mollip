import { Pressable, Text, View } from 'react-native';

import { HOME_SIDE_PADDING } from '@/src/components/home/HomeSectionHeader';

interface HomeSectionMessageProps {
	/** 'error'면 다시 시도 버튼을, 'empty'면 안내 문구만 보여준다 */
	kind: 'error' | 'empty';
	sectionName: string;
	emptyText: string;
	onRetry: () => void;
}

/** 홈 하단 섹션의 에러·빈 상태 공통 표시 */
export function HomeSectionMessage({
	kind,
	sectionName,
	emptyText,
	onRetry,
}: HomeSectionMessageProps) {
	return kind === 'error' ? (
		<View className="items-center justify-center gap-2 py-8">
			<Text className="text-gray700 text-[13px] font-pretendard-regular">
				전시 정보를 불러오지 못했어요
			</Text>
			<Pressable
				onPress={onRetry}
				accessibilityLabel={`${sectionName} 다시 불러오기`}
				accessibilityRole="button"
				hitSlop={8}
			>
				<Text className="text-gray900 text-[13px] font-pretendard-semibold">다시 시도</Text>
			</Pressable>
		</View>
	) : (
		<Text
			style={{ paddingHorizontal: HOME_SIDE_PADDING }}
			className="py-4 text-gray700 text-[13px] font-pretendard-regular"
		>
			{emptyText}
		</Text>
	);
}
