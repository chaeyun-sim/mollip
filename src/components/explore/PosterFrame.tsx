import { View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { colors } from '@/src/constants/colors';

interface PosterFrameProps {
	thumbnail: string | null | undefined;
	width: number;
	height: number;
	borderRadius?: number;
	iconSize?: number;
}

export function PosterFrame({
	thumbnail,
	width,
	height,
	borderRadius = 18,
	iconSize = 48,
}: PosterFrameProps) {
	return (
		<View
			style={{
				width,
				height,
				borderRadius,
				shadowColor: colors.gray900,
				shadowOpacity: 0.08,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 3 },
			}}
		>
			<ImageFallback
				heroImageUri={thumbnail}
				className="bg-image-placeholder"
				style={{ width, height, borderRadius, overflow: 'hidden' }}
				iconSize={iconSize}
				resizeMode="cover"
				useImageProxy
				loadingIndicatorColor={colors.gray500}
			/>
		</View>
	);
}
