import { Text } from 'react-native';

import { cn } from '@/src/lib/cn';
import type { ExhibitionMeta } from '@/src/utils/homeExhibitionMeta';

interface HomeExhibitionMetaProps {
	meta: ExhibitionMeta | null;
	className?: string;
}

/**
 * 홈 카드 하단 기간·D-day 라벨.
 * 보라색 강조는 "곧 막을 내려요"에만 쓰므로, 여기서는 마감 임박을 진한 회색 + 굵기로만 구분한다.
 */
export function HomeExhibitionMeta({ meta, className }: HomeExhibitionMetaProps) {
	return (
		meta && (
			<Text
				numberOfLines={1}
				className={cn(
					'text-[12px]',
					meta.urgent
						? 'text-gray900 font-pretendard-semibold'
						: 'text-gray600 font-pretendard-regular',
					className,
				)}
			>
				{meta.label}
			</Text>
		)
	);
}
