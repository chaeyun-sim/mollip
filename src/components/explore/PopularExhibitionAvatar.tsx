import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { colors } from '@/src/constants/colors';
import type { ExhibitionSummary } from '@/src/hooks/useExploreScreenData';

const AVATAR_SIZE = 56;
const RING_WIDTH = 2;
const RING_GAP = 3;
const ITEM_WIDTH = 84;

interface PopularExhibitionAvatarProps {
	item: ExhibitionSummary;
	onPress: (id: string) => void;
}

export function PopularExhibitionAvatar({ item, onPress }: PopularExhibitionAvatarProps) {
	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(item.id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`${item.title}, ${item.venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: ITEM_WIDTH })}
		>
			<View
				className="items-center justify-center rounded-full self-center"
				style={{
					width: AVATAR_SIZE + RING_WIDTH * 2 + RING_GAP * 2,
					height: AVATAR_SIZE + RING_WIDTH * 2 + RING_GAP * 2,
					borderWidth: RING_WIDTH,
					borderColor: colors.gray900,
					overflow: 'hidden'
				}}
			>
				<ImageFallback
					heroImageUri={item.thumbnail}
					className="rounded-full bg-image-placeholder"
					style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
					iconSize={22}
					resizeMode="cover"
					useImageProxy
					loadingIndicatorColor={colors.gray500}
				/>
			</View>
		</Pressable>
	);
}
