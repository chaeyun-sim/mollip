import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import { PosterFrame } from '@/src/components/explore/PosterFrame';
import type { RecommendableItem } from '@/src/components/explore/RecommendedExhibitions';
import { StatusBadge } from '@/src/components/search/StatusBadge';

interface GridExhibitionCellProps {
	item: RecommendableItem;
	colWidth: number;
	gridHeight: number;
	onPress: (id: string) => void;
}

export function GridExhibitionCell({ item, colWidth, gridHeight, onPress }: GridExhibitionCellProps) {
	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(item.id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`${item.title}, ${item.venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, width: '100%' })}
		>
			<PosterFrame
				thumbnail={item.thumbnail}
				width={colWidth}
				height={gridHeight}
				borderRadius={16}
				iconSize={40}
			/>
			<View style={{ width: colWidth }}>
				<StatusBadge status={item.status} className="mt-3" />
				<Text className="mt-1 text-primary text-[13px] leading-[18px] font-pretendard-semibold">
					{item.title.trim()}
				</Text>
				<Text numberOfLines={1} className="text-muted text-[11px] mt-0.5 font-pretendard-regular">
					{item.venue.trim()}
				</Text>
			</View>
		</Pressable>
	);
}
