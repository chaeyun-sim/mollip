import { useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CenteredLoader } from '@/src/components/common/CenteredLoader';
import { RetryErrorState } from '@/src/components/common/RetryErrorState';
import { ExhibitionListRow } from '@/src/components/explore/ExhibitionListRow';
import type { RecommendableItem } from '@/src/components/explore/RecommendedExhibitions';
import { useAllExhibitions } from '@/src/hooks/useAllExhibitions';
import { Screen } from '@/src/components/layout/Screen';
import { colors } from '@/src/constants/colors';

const HORIZONTAL_PADDING = 24;
const ROW_GAP = 16;

export default function ExhibitionsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const endReachedCalledRef = useRef(false);

	const { items, status, isLoadingMore, hasMore, loadMore, refetch } = useAllExhibitions();

	const usableWidth = windowWidth - HORIZONTAL_PADDING * 2 - ROW_GAP;
	const columnWidth = usableWidth * 0.45;

	const openExhibition = useCallback(
		(id: string) => {
			router.push(`/(explore)/${id}`);
		},
		[router],
	);

	const handleEndReached = useCallback(() => {
		if (endReachedCalledRef.current) return;
		endReachedCalledRef.current = true;
		loadMore();
	}, [loadMore]);

	const handleScrollBeginDrag = useCallback(() => {
		endReachedCalledRef.current = false;
	}, []);

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
			return <ActivityIndicator color={colors.secondary} />;
		}

		if (!hasMore) {
			return (
				<Text className="text-muted text-[12px] font-pretendard-regular">
					모든 전시를 불러왔어요
				</Text>
			);
		}

		return null;
	}

	const renderFooter = useCallback(() => {
		if (items.length === 0) return null;

		return (
			<View className="items-center justify-center" style={{ height: 56 }}>
				{renderFooterContent()}
			</View>
		);
	}, [items.length, isLoadingMore, hasMore]);

	const renderEmpty = useCallback(() => {
		if (status === 'loading') {
			return <CenteredLoader className="flex-1 py-24" />;
		}

		if (status === 'error') {
			return (
				<RetryErrorState
					message="전시 정보를 불러오지 못했어요"
					onRetry={refetch}
					retryAccessibilityLabel="다시 불러오기"
					className="flex-1 py-24"
				/>
			);
		}

		return null;
	}, [status, refetch]);

	return (
		<Screen variant="warm">
			{/* 헤더 */}
			<Screen.Header>
				<Screen.Header.Logo />
			</Screen.Header>

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
				onEndReached={handleEndReached}
				onEndReachedThreshold={0.8}
				onScrollBeginDrag={handleScrollBeginDrag}
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
