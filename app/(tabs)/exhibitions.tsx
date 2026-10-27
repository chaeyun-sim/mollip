import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListFooter } from '@/src/components/common/ListFooter';
import { Result } from '@/src/components/common/Result';
import { ErrorIllustration } from '@/src/components/illustration/ErrorIllustration';
import { ExhibitionListRow } from '@/src/components/explore/ExhibitionListRow';
import { ExhibitionListRowSkeleton } from '@/src/components/explore/ExhibitionListRowSkeleton';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { Screen } from '@/src/components/layout/Screen';
import { useAllExhibitions } from '@/src/hooks/useAllExhibitions';
import { CommonHeader } from '@/src/components/common/CommonHeader';

const SKELETON_ROW_COUNT = 5;

const HORIZONTAL_PADDING = 24;
const ROW_GAP = 16;

export default function ExhibitionsScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();

	const { items, status, isLoadingMore, hasMore, loadMore, refetch } = useAllExhibitions();

	const usableWidth = windowWidth - HORIZONTAL_PADDING * 2 - ROW_GAP;
	const columnWidth = usableWidth * 0.45;

	const openExhibition = useCallback(
		(id: string) => {
			router.push(`/(explore)/${id}`);
		},
		[router],
	);

	const renderItem = useCallback(
		({ item, index }: { item: RecommendableItem; index: number }) => (
			<ExhibitionListRow
				item={item}
				onPress={openExhibition}
				showDivider={index < items.length - 1}
				columnWidth={columnWidth}
			/>
		),
		[openExhibition, items.length, columnWidth],
	);

	function renderFooterContent() {
		if (isLoadingMore) {
			return <ListFooter loading accessibilityLabel={t('exhibitions.loading_more_a11y')} />;
		}

		if (!hasMore) {
			return (
				<Text className="text-gray500 text-[12px] font-pretendard-regular">
					{t('exhibitions.all_loaded')}
				</Text>
			);
		}

		return <ListFooter onPress={loadMore} accessibilityLabel={t('exhibitions.load_more_a11y')} />;
	}

	const renderFooter = useCallback(() => {
		if (items.length === 0) return null;

		return (
			<View className="items-center justify-center" style={{ height: 56 }}>
				{renderFooterContent()}
			</View>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items.length, isLoadingMore, hasMore, loadMore, t]);

	const renderEmpty = useCallback(() => {
		if (status === 'loading') {
			return (
				<View>
					{Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
						<ExhibitionListRowSkeleton
							key={index}
							columnWidth={columnWidth}
							showDivider={index < SKELETON_ROW_COUNT - 1}
						/>
					))}
				</View>
			);
		}

		if (status === 'error') {
			return (
				<Result
					icon="cloud-offline-outline"
					illustration={<ErrorIllustration />}
					tone="danger"
					title={t('exhibitions.load_error_title')}
					actionLabel={t('common.retry')}
					onAction={refetch}
					className="py-24"
				/>
			);
		}

		return null;
	}, [status, refetch, columnWidth, t]);

	return (
		<Screen variant="warm">
			{/* 헤더 */}
			<CommonHeader />

			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				contentContainerStyle={{
					paddingBottom: insets.bottom + 24,
					flexGrow: 1,
				}}
				ListEmptyComponent={renderEmpty}
				ListFooterComponent={renderFooter}
				onRefresh={refetch}
				refreshing={status === 'loading' && items.length === 0}
				showsVerticalScrollIndicator={false}
				removeClippedSubviews={false}
				windowSize={10}
				maxToRenderPerBatch={10}
				initialNumToRender={10}
			/>
		</Screen>
	);
}
