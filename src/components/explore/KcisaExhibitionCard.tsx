import { Pressable, Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import type { KcisaExhibitionItem } from '@/src/hooks/useKcisaExhibitions';
import { colors } from '@/src/constants/colors';

const CARD_WIDTH = 148;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 4) / 3);

interface KcisaExhibitionCardProps {
	item: KcisaExhibitionItem;
	onPress: (id: string) => void;
}

export function KcisaExhibitionCard({
	item,
	onPress,
}: KcisaExhibitionCardProps) {
	return (
		<Pressable
			onPress={() => onPress(item.id)}
			accessibilityLabel={`${item.title}, ${item.venue}`}
			accessibilityRole='button'
			style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, width: CARD_WIDTH })}
		>
			<View
				className='rounded-[18px] overflow-hidden'
				style={{
					width: CARD_WIDTH,
					height: CARD_HEIGHT,
					shadowColor: colors.primary,
					shadowOpacity: 0.1,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 4 },
				}}
			>
				<ImageFallback
					heroImageUri={item.thumbnail}
					className='bg-image-placeholder'
					style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
					iconSize={64}
					resizeMode='cover'
				/>
			</View>
			<Text
				numberOfLines={2}
				style={{ width: CARD_WIDTH }}
				className='mt-2.5 text-primary text-[13px] leading-[18px] font-pretendard-semibold'
			>
				{item.title}
			</Text>
			<Text
				numberOfLines={1}
				style={{ width: CARD_WIDTH }}
				className='text-muted text-[11px] mt-0.5 font-pretendard-regular'
			>
				{item.venue}
			</Text>
		</Pressable>
	);
}
