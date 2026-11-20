import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { cn } from '@/src/lib/cn';
import { localizeExhibition } from '@/src/utils/localizedExhibition';

const ROW_HEIGHT = 100;

const EN_MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
] as const;

function formatStartDate(raw: string | null | undefined, language: string): string {
	if (!raw) return '';
	const [, month, day] = raw.split('.');
	if (!month || !day) return '';
	const enMonth = EN_MONTHS[Number(month) - 1];
	if (language === 'en' && enMonth) return `${enMonth} ${Number(day)}`;
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
	const { i18n } = useTranslation();

	const localized = localizeExhibition(item, i18n.language);

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(item.id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`${localized.title}, ${localized.venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View className={cn('flex-row gap-4 py-4', showDivider && 'border-b border-description')}>
				{imageUnavailable ? (
					<View
						className="bg-image-placeholder items-start"
						style={{ width: columnWidth, height: ROW_HEIGHT }}
					>
						<Text className="text-gray900 text-[19px] font-hahmlet-bold text-center pt-2 px-3">
							{formatStartDate(item.startDate, i18n.language)}
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
						loadingIndicatorColor="gray500"
					/>
				)}
				<View className="flex-1" style={{ height: ROW_HEIGHT }}>
					<View className="items-start gap-0.5">
						<Text numberOfLines={1} className="text-gray500 text-[9px] font-pretendard-regular">
							{item.startDate} ~ {item.endDate}
						</Text>
						<Text numberOfLines={1} className="text-gray500 text-[9px] font-pretendard-regular">
							{localized.venue}
						</Text>
					</View>
					<View className="justify-center items-center absolute w-full top-8 px-4 flex-1 h-[52px]">
						<Text
							numberOfLines={2}
							className="text-gray900 text-[15px] leading-[21px] font-hahmlet-semibold text-center"
						>
							{localized.title}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}
