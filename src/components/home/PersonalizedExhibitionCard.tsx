import { Text, View } from 'react-native';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { STATUS_LABELS } from '@/src/utils/exhibitionSearch';

interface PersonalizedExhibitionCardProps {
	item: RecommendableItem;
	width: number;
	onPress: (id: string) => void;
}

export function PersonalizedExhibitionCard({
	item,
	width,
	onPress,
}: PersonalizedExhibitionCardProps) {
	const title = item.title.trim();
	const venue = item.venue.trim() || '장소 정보 없음';

	return (
		<ScalePressable
			onPress={() => onPress(item.id)}
			accessibilityRole="button"
			accessibilityLabel={`${title}, ${venue}, ${STATUS_LABELS[item.status]}`}
			className="shrink-0"
		>
			<View style={{ width }}>
				<ImageFallback
					heroImageUri={item.thumbnail}
					className="rounded-xl bg-image-placeholder"
					style={{ width, height: width }}
					iconSize={40}
					resizeMode="cover"
					useImageProxy
				/>
				<Text
					numberOfLines={2}
					className="mt-2.5 text-gray900 text-[14px] leading-[19px] font-pretendard-semibold"
					lineBreakStrategyIOS="hangul-word"
				>
					{title}
				</Text>
				<Text numberOfLines={1} className="mt-0.5 text-gray700 text-[12px] font-pretendard-regular">
					{venue}
				</Text>
			</View>
		</ScalePressable>
	);
}
