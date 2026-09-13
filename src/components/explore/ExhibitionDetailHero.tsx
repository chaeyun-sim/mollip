import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, View, type ImageSourcePropType } from 'react-native';
import Animated from 'react-native-reanimated';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import type { HeroImageStyle } from '@/src/hooks/useHeroAnimation';

export const EXHIBITION_HERO_HEIGHT = Dimensions.get('window').height * 0.62;

interface ExhibitionDetailHeroProps {
	title: string;
	heroImageUri?: string;
	posterImage?: ImageSourcePropType;
	animatedStyle: HeroImageStyle;
}

export function ExhibitionDetailHero({
	title,
	heroImageUri,
	posterImage,
	animatedStyle,
}: ExhibitionDetailHeroProps) {
	return (
		<View className="overflow-hidden w-full" style={{ height: EXHIBITION_HERO_HEIGHT }}>
			<Animated.View style={[{ width: '100%', height: EXHIBITION_HERO_HEIGHT }, animatedStyle]}>
				<ImageFallback
					heroImageUri={heroImageUri}
					posterImage={posterImage}
					style={{ height: EXHIBITION_HERO_HEIGHT }}
					iconSize={160}
					resizeMode="cover"
					dimOverlay
					className="w-full"
					accessibilityLabel={`${title} 전시 포스터`}
					useImageProxy
				/>
			</Animated.View>

			<LinearGradient
				colors={['transparent', 'rgba(0,0,0,0.7)']}
				className="absolute bottom-0 left-0 right-0 h-[292px] justify-end pb-6"
			/>
		</View>
	);
}
