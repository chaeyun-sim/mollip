import * as Haptics from 'expo-haptics';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import type { Artwork } from '@/src/data/exhibitions';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ExhibitionArtworkCardProps {
	artwork: Artwork;
	onPress: () => void;
}

export function ExhibitionArtworkCard({ artwork, onPress }: ExhibitionArtworkCardProps) {
	const cardSize = (SCREEN_WIDTH - 48 - 12) / 2;
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withSpring(0.96, { damping: 15 });
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 15 });
			}}
			onPress={onPress}
			style={{ width: cardSize }}
		>
			<Animated.View style={animatedStyle}>
				<ImageFallback
					heroImageUri={artwork.imageUri}
					posterImage={artwork.imageSource}
					className="rounded-[16px] bg-image-placeholder"
					style={{ height: cardSize, width: cardSize }}
					iconSize={cardSize * 0.55}
					resizeMode="cover"
				/>
				<View className="pt-2">
					<Text className="font-pretendard-medium text-[13px] text-gray-800" numberOfLines={1}>
						{artwork.title}
					</Text>
					<Text className="font-pretendard-regular text-[11px] text-gray-400 mt-0.5">
						{artwork.artist}
						{artwork.year ? ` · ${artwork.year}` : ''}
					</Text>
				</View>
			</Animated.View>
		</Pressable>
	);
}
