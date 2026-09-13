import { Pressable, Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { StatusBadge } from '@/src/components/explore/StatusBadge';
import type { KcisaExhibitionItem } from '@/src/hooks/useKcisaExhibitions';
import { colors } from '@/src/constants/colors';

const CARD_HEIGHT = Math.round((140 * 4) / 3);

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
			className="w-[148px]"
			style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
		>
			<View
				className="rounded-[8px] overflow-hidden w-[140px]"
				style={{
					height: CARD_HEIGHT,
					shadowColor: colors.gray900,
					shadowOpacity: 0.1,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 4 },
				}}
			>
				<ImageFallback
					heroImageUri={item.thumbnail}
					className="bg-image-placeholder w-[140px]"
					style={{ height: CARD_HEIGHT }}
					iconSize={64}
					resizeMode="cover"
					useImageProxy
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
			<View className="mt-2.5 w-[148px]">
				<StatusBadge status={item.status} />
			</View>
			<Text
				numberOfLines={2}
				className="w-[148px] mt-1 text-gray900 text-[13px] leading-[18px] font-pretendard-semibold"
			>
				{item.title.trim()}
			</Text>
			<Text
				numberOfLines={1}
				className="w-[148px] text-gray500 text-[11px] mt-0.5 font-pretendard-regular"
			>
				{item.venue.trim()}
			</Text>
		</Pressable>
	);
}
