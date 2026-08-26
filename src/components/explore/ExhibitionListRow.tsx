import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import type { RecommendableItem } from '@/src/components/explore/RecommendedExhibitions';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

const ROW_HEIGHT = 100;

function formatStartDate(raw: string | null | undefined): string {
	if (!raw) return '';
	const [, month, day] = raw.split('.');
	if (!month || !day) return '';
	return `${Number(month)}월 ${Number(day)}일`;
}

interface ExhibitionListRowProps {
	item: RecommendableItem;
	onPress: (id: string) => void;
	showDivider: boolean;
	columnWidth: number;
}

export function ExhibitionListRow({
	item,
	onPress,
	showDivider,
	columnWidth,
}: ExhibitionListRowProps) {
	const [imageUnavailable, setImageUnavailable] = useState(false);

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(item.id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`${item.title}, ${item.venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View className={cn('flex-row gap-4 py-4', showDivider ? 'border-b border-description' : '')}>
				{imageUnavailable ? (
					<View
						className="bg-image-placeholder items-start"
						style={{ width: columnWidth, height: ROW_HEIGHT }}
					>
						<Text className="text-primary text-[19px] font-hahmlet-bold text-center pt-2 px-3">
							{formatStartDate(item.startDate)}
						</Text>
					</View>
				) : (
					<ImageFallback
						heroImageUri={item.thumbnail}
						onFallback={() => setImageUnavailable(true)}
						style={{ width: columnWidth, height: ROW_HEIGHT }}
						iconSize={28}
						resizeMode="cover"
						useImageProxy
						loadingIndicatorColor={colors.muted}
					/>
				)}
				<View className="flex-1" style={{ height: ROW_HEIGHT }}>
					<View className="items-start gap-0.5">
						<Text numberOfLines={1} className="text-muted text-[9px] font-pretendard-regular">
							{item.startDate} ~ {item.endDate}
						</Text>
						<Text numberOfLines={1} className="text-muted text-[9px] font-pretendard-regular">
							{item.venue.trim()}
						</Text>
					</View>
					<View className="justify-center items-center absolute w-full top-8 px-4 flex-1 h-[52px]">
						<Text
							numberOfLines={2}
							className="text-primary text-[15px] leading-[21px] font-hahmlet-semibold text-center"
						>
							{item.title.trim()}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}
