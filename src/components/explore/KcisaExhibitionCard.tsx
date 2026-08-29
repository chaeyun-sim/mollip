import { Pressable, Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { StatusBadge } from '@/src/components/search/StatusBadge';
import type { KcisaExhibitionItem } from '@/src/hooks/useKcisaExhibitions';
import { colors } from '@/src/constants/colors';

const CARD_WIDTH = 148;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 4) / 3);

interface KcisaExhibitionCardProps {
	item: KcisaExhibitionItem;
	onPress: (id: string) => void;
	index?: number;
}

export function KcisaExhibitionCard({ item, onPress, index }: KcisaExhibitionCardProps) {
	return (
		<Pressable
			onPress={() => onPress(item.id)}
			accessibilityLabel={`${item.title}, ${item.venue}`}
			accessibilityRole="button"
			style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, width: CARD_WIDTH })}
		>
			<View
				className="rounded-[8px] overflow-hidden"
				style={{
					width: CARD_WIDTH,
					height: CARD_HEIGHT,
					shadowColor: colors.gray900,
					shadowOpacity: 0.1,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 4 },
				}}
			>
				<ImageFallback
					heroImageUri={item.thumbnail}
					className="bg-image-placeholder"
					style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
					iconSize={64}
					resizeMode="cover"
				/>
				{index !== undefined && (
					<Text
						className="absolute top-2.5 left-2.5 text-white text-[13px] font-hahmlet-bold"
						style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}
					>
						{String(index).padStart(2, '0')}
					</Text>
				)}
			</View>
			<View style={{ width: CARD_WIDTH }} className="mt-2.5">
				<StatusBadge status={item.status} />
			</View>
			<Text
				numberOfLines={2}
				style={{ width: CARD_WIDTH }}
				className="mt-1 text-gray900 text-[13px] leading-[18px] font-pretendard-semibold"
			>
				{item.title}
			</Text>
			<Text
				numberOfLines={1}
				style={{ width: CARD_WIDTH }}
				className="text-gray500 text-[11px] mt-0.5 font-pretendard-regular"
			>
				{item.venue}
			</Text>
		</Pressable>
	);
}
