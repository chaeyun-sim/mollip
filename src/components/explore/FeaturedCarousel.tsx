import { FlatList, View, useWindowDimensions } from 'react-native';
import { FeaturedExhibitionHero, type FeaturedExhibitionProps } from '@/src/components/explore/FeaturedExhibitionHero';

const SCREEN_PADDING = 42;

interface FeaturedCarouselProps {
	items: Omit<FeaturedExhibitionProps, 'onPress'>[];
	onPress: (id: string) => void;
}

export function FeaturedCarousel({ items, onPress }: FeaturedCarouselProps) {
	const { width: cardWidth } = useWindowDimensions();

	if (items.length === 0) return null;

	return (
		<FlatList
			data={items}
			keyExtractor={(item) => item.id}
			horizontal
			showsHorizontalScrollIndicator={false}
			snapToInterval={cardWidth}
			decelerationRate="fast"
			renderItem={({ item, index }) => (
				<View style={{ width: cardWidth - SCREEN_PADDING, marginLeft: index > 0 ? SCREEN_PADDING : 0 }}>
					<FeaturedExhibitionHero {...item} onPress={onPress} />
				</View>
			)}
		/>
	);
}
