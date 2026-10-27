import { useTranslation } from 'react-i18next';
import { Text, useWindowDimensions, View } from 'react-native';
import { FadeInView } from '@/src/components/common/FadeInView';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';
import { HOME_SIDE_PADDING, HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import { type FeaturedPick } from '@/src/hooks/queries/useFeaturedTrio';
import { getGridColumnWidth } from '@/src/utils/homeLayout';

const COLUMNS = 2;
const COLUMN_GAP = 14;
const ROW_GAP = 22;
const MAX_ITEMS = 4;
/** 카드가 하나씩 떠오르는 간격 */
const ITEM_STAGGER_MS = 70;

interface HomeRecommendedGridProps {
	/** 섹션 번호 */
	index: number;
	items: FeaturedPick[];
	isLoading: boolean;
	onPress: (id: string) => void;
}

/** 추천 전시 — 2×2 정사각 포스터 그리드 (마지막 행이 한 칸만 남지 않게 짝수로 자른다) */
export function HomeRecommendedGrid({
	index,
	items,
	isLoading,
	onPress,
}: HomeRecommendedGridProps) {
	const { t } = useTranslation();

	const { width: windowWidth } = useWindowDimensions();

	const columnWidth = getGridColumnWidth(windowWidth, HOME_SIDE_PADDING, COLUMN_GAP, COLUMNS);
	const header = <HomeSectionHeader index={index} title={t('home.recommended')} />;
	const gridStyle = {
		paddingHorizontal: HOME_SIDE_PADDING,
		columnGap: COLUMN_GAP,
		rowGap: ROW_GAP,
	};

	if (items.length === 0 && isLoading) {
		return (
			<View>
				{header}
				<View className="flex-row flex-wrap" style={gridStyle}>
					{Array.from({ length: MAX_ITEMS }).map((_, i) => (
						<SkeletonBox
							key={i}
							className="rounded-xl bg-gray300"
							style={{ width: columnWidth, height: columnWidth }}
						/>
					))}
				</View>
			</View>
		);
	}

	if (items.length === 0) {
		return (
			<View>
				{header}
				<Text
					className="text-gray600 text-[14px] font-pretendard-regular"
					style={{ paddingHorizontal: HOME_SIDE_PADDING }}
				>
					{t('home.no_exhibitions_to_recommend')}
				</Text>
			</View>
		);
	}

	const capped = items.slice(0, MAX_ITEMS);
	const visible =
		capped.length > 1 ? capped.slice(0, capped.length - (capped.length % COLUMNS)) : capped;

	return (
		<View>
			{header}
			<View className="flex-row flex-wrap" style={gridStyle}>
				{visible.map((item, i) => {
					const title = item.title.trim();
					const venue = item.venue.trim() || t('common.no_venue_info');
					return (
						<FadeInView key={item.id} delay={i * ITEM_STAGGER_MS}>
							<ScalePressable
								onPress={() => onPress(item.id)}
								accessibilityRole="button"
								accessibilityLabel={`${t(`home.featured.${item.badge}`)}, ${title}, ${venue}, ${t(`exhibitions.${item.status}`)}`}
							>
								{/* 캡션이 열 폭 안에서 줄바꿈되도록 폭을 View에 고정한다 */}
								<View style={{ width: columnWidth }}>
									<ImageFallback
										heroImageUri={item.thumbnail}
										className="overflow-hidden rounded-xl bg-image-placeholder"
										style={{ width: columnWidth, height: columnWidth }}
										iconSize={44}
										resizeMode="cover"
										useImageProxy
									/>
									<Text className="mt-2.5 text-gray600 text-[11px] font-pretendard-medium">
										{t(`home.featured.${item.badge}`)}
									</Text>
									<Text
										numberOfLines={2}
										className="mt-0.5 text-gray900 text-[14px] leading-[19px] font-pretendard-semibold"
										lineBreakStrategyIOS="hangul-word"
									>
										{title}
									</Text>
									<Text
										numberOfLines={1}
										className="mt-0.5 text-gray700 text-[12px] font-pretendard-regular"
									>
										{venue}
									</Text>
								</View>
							</ScalePressable>
						</FadeInView>
					);
				})}
			</View>
		</View>
	);
}
