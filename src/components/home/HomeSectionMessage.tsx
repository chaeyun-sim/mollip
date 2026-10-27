import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();

	return kind === 'error' ? (
		<View className="items-center justify-center gap-2 py-8">
			<Text className="text-gray700 text-[13px] font-pretendard-regular">
				{t('exhibitions.load_error_title')}
			</Text>
			<Pressable
				onPress={onRetry}
				accessibilityLabel={`${sectionName} 다시 불러오기`}
				accessibilityRole="button"
				hitSlop={8}
			>
				<Text className="text-gray900 text-[13px] font-pretendard-semibold">
					{t('common.retry')}
				</Text>
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
