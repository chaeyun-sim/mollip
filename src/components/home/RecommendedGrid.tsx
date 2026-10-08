import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';
import { HomeExhibitionMeta } from '@/src/components/home/HomeExhibitionMeta';
import { HOME_SIDE_PADDING, HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import { HomeSectionMessage } from '@/src/components/home/HomeSectionMessage';
import type { ExhibitionSummary } from '@/src/hooks/queries/useExploreScreenData';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';
import { STATUS_LABELS } from '@/src/utils/exhibitionSearch';
import { getExhibitionMeta } from '@/src/utils/homeExhibitionMeta';
import { getGridColumnWidth } from '@/src/utils/homeLayout';

const COLUMN_GAP = 14;
const ROW_GAP = 24;
const MAX_ITEMS = 4;
const COLUMNS = 2;

interface RecommendedGridProps {
	title: string;
	subtitle?: string;
	items: ExhibitionSummary[];
	status: AsyncStatus;
	onPress: (id: string) => void;
	onRefetch: () => void;
}

/** 추천 전시 — 2×2 정사각 카드 그리드 (최대 4개, 마지막 행이 한 칸만 남지 않게 짝수로 맞춘다) */
export function RecommendedGrid({
	title,
	subtitle,
	items,
	status,
	onPress,
	onRefetch,
}: RecommendedGridProps) {
	const { width: windowWidth } = useWindowDimensions();

	const columnWidth = getGridColumnWidth(windowWidth, HOME_SIDE_PADDING, COLUMN_GAP);
	const header = <HomeSectionHeader title={title} subtitle={subtitle} />;

	if (status === 'error') {
		return (
			<View>
				{header}
				<HomeSectionMessage kind="error" sectionName="추천 전시" emptyText="" onRetry={onRefetch} />
			</View>
		);
	}

	if (items.length === 0 && status === 'loading') {
		return (
			<View>
				{header}
				<View
					className="flex-row flex-wrap"
					style={{ paddingHorizontal: HOME_SIDE_PADDING, columnGap: COLUMN_GAP, rowGap: ROW_GAP }}
				>
					{Array.from({ length: MAX_ITEMS }).map((_, index) => (
						<SkeletonBox
							key={index}
							className="rounded-[14px] bg-[#E0DCD5]"
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
				<HomeSectionMessage
					kind="empty"
					sectionName="추천 전시"
					emptyText="추천할 전시가 없어요"
					onRetry={onRefetch}
				/>
			</View>
		);
	}

	// 이미지가 있는 전시를 앞으로 (원래 순서는 유지), 최대 4개를 짝수 개로 자른다
	const withImageFirst = [
		...items.filter((item) => Boolean(item.thumbnail?.trim())),
		...items.filter((item) => !item.thumbnail?.trim()),
	].slice(0, MAX_ITEMS);
	const visibleCount =
		withImageFirst.length > 1
			? withImageFirst.length - (withImageFirst.length % COLUMNS)
			: withImageFirst.length;
	const visible = withImageFirst.slice(0, visibleCount);
	const rows = Array.from({ length: Math.ceil(visible.length / COLUMNS) }, (_, i) =>
		visible.slice(i * COLUMNS, i * COLUMNS + COLUMNS),
	);

	return (
		<View>
			{header}
			<View style={{ paddingHorizontal: HOME_SIDE_PADDING, rowGap: ROW_GAP }}>
				{rows.map((row) => (
					<View key={row[0].id} className="flex-row" style={{ columnGap: COLUMN_GAP }}>
						{row.map((item) => {
							const itemTitle = item.title.trim();
							const venue = item.venue.trim() || '장소 정보 없음';
							const meta = getExhibitionMeta(item);
							return (
								<Pressable
									key={item.id}
									onPress={() => onPress(item.id)}
									accessibilityRole="button"
									accessibilityLabel={`${itemTitle}, ${venue}, ${meta?.label ?? STATUS_LABELS[item.status]}`}
									style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
								>
									<View style={{ width: columnWidth }}>
										<ImageFallback
											heroImageUri={item.thumbnail}
											className="overflow-hidden rounded-[14px] bg-image-placeholder"
											style={{ width: columnWidth, height: columnWidth }}
											iconSize={48}
											resizeMode="cover"
											useImageProxy
										/>
										<Text
											numberOfLines={2}
											className="mt-2.5 text-gray900 text-[14px] leading-[19px] font-pretendard-semibold"
										>
											{itemTitle}
										</Text>
										<Text
											numberOfLines={1}
											className="mt-0.5 text-gray700 text-[12px] font-pretendard-regular"
										>
											{venue}
										</Text>
										<HomeExhibitionMeta meta={meta} className="mt-1" />
									</View>
								</Pressable>
							);
						})}
					</View>
				))}
			</View>
		</View>
	);
}
