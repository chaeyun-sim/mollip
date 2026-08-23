import { useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	View,
	useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import {
	GridExhibitionCell,
	type RecommendableItem,
} from '@/src/components/explore/ExploreHomeSections';
import { useAllExhibitions } from '@/src/hooks/useAllExhibitions';
import { colors } from '@/src/constants/colors';

const HORIZONTAL_PADDING = 16;
const GRID_GAP = 12;
const ROW_GAP = GRID_GAP + 8;

export default function ExhibitionsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const endReachedCalledRef = useRef(false);

	const { items, status, isLoadingMore, hasMore, loadMore, refetch } = useAllExhibitions();

	const colWidth = (windowWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
	const gridHeight = Math.round((colWidth * 4) / 3);

	const openExhibition = (id: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.push(`/(explore)/${id}`);
	};

	const handleEndReached = useCallback(() => {
		if (endReachedCalledRef.current) return;
		endReachedCalledRef.current = true;
		loadMore();
	}, [loadMore]);

	const handleScrollBeginDrag = useCallback(() => {
		endReachedCalledRef.current = false;
	}, []);

	function renderItem({ item, index }: { item: RecommendableItem; index: number }) {
		const rowIndex = Math.floor(index / 2);
		return (
			<View style={{ marginTop: rowIndex === 0 ? 0 : ROW_GAP }}>
				<GridExhibitionCell
					item={item}
					colWidth={colWidth}
					gridHeight={gridHeight}
					onPress={openExhibition}
				/>
			</View>
		);
	}

	function renderFooter() {
		if (items.length === 0) return null;

		return (
			<View className='items-center justify-center' style={{ height: 56 }}>
				{isLoadingMore ? (
					<ActivityIndicator color={colors.muted} />
				) : !hasMore ? (
					<Text className='text-muted text-[12px] font-pretendard-regular'>
						모든 전시를 불러왔어요
					</Text>
				) : null}
			</View>
		);
	}

	function renderEmpty() {
		if (status === 'loading') {
			return (
				<View className='flex-1 items-center justify-center py-24'>
					<ActivityIndicator color={colors.muted} />
				</View>
			);
		}

		if (status === 'error') {
			return (
				<View className='flex-1 items-center justify-center py-24 gap-2'>
					<Text className='text-muted text-[13px] font-pretendard-regular'>
						전시 정보를 불러오지 못했어요
					</Text>
					<Pressable
						onPress={refetch}
						accessibilityLabel='다시 불러오기'
						accessibilityRole='button'
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					>
						<Text className='text-primary text-[13px] font-pretendard-semibold'>
							다시 시도
						</Text>
					</Pressable>
				</View>
			);
		}

		return null;
	}

	return (
		<View className='flex-1 bg-[#F4F4F1]' style={{ paddingTop: insets.top }}>
			{/* 헤더 */}
			<View className='px-4 pt-4 pb-3'>
				<Text className='text-primary text-[22px] font-hahmlet-bold'>전시</Text>
			</View>

			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				numColumns={2}
				renderItem={renderItem}
				columnWrapperStyle={{ gap: GRID_GAP }}
				contentContainerStyle={{
					paddingHorizontal: HORIZONTAL_PADDING,
					paddingBottom: insets.bottom + 24,
					paddingTop: 4,
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
		</View>
	);
}
