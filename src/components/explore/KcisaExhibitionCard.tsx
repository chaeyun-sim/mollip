import { Image, Pressable, Text, View } from 'react-native';

import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import type { KcisaExhibitionItem } from '@/src/hooks/useKcisaExhibitions';

const CARD_WIDTH = 148;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 4) / 3);

interface KcisaExhibitionCardProps {
	item: KcisaExhibitionItem;
	onPress: (id: string) => void;
}

export function KcisaExhibitionCard({ item, onPress }: KcisaExhibitionCardProps) {
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
					shadowColor: '#1C1917',
					shadowOpacity: 0.1,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 4 },
				}}
			>
				{item.thumbnail ? (
					<Image
						source={{ uri: item.thumbnail }}
						style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 18 }}
						resizeMode='cover'
					/>
				) : (
					<EmptyImagePlaceholder
						className='items-center justify-center bg-[#E5E1D8]'
						style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
						iconSize={64}
					/>
				)}
			</View>
			<Text
				numberOfLines={2}
				style={{ width: CARD_WIDTH, fontFamily: 'Pretendard-SemiBold' }}
				className='mt-2.5 text-[#1C1917] text-[13px] leading-[18px]'
			>
				{item.title}
			</Text>
			<Text
				numberOfLines={1}
				style={{ width: CARD_WIDTH, fontFamily: 'Pretendard-Regular' }}
				className='text-[#A8A29E] text-[11px] mt-0.5'
			>
				{item.venue}
			</Text>
		</Pressable>
	);
}
