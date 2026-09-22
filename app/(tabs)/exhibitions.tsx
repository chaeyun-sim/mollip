import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { ListFooter } from '@/src/components/common/ListFooter';
import { Result } from '@/src/components/common/Result';
import { ExhibitionListRow } from '@/src/components/explore/ExhibitionListRow';
import { ExhibitionListRowSkeleton } from '@/src/components/explore/ExhibitionListRowSkeleton';
import type { RecommendableItem } from '@/src/components/explore/RecommendableItem.types';
import { Screen } from '@/src/components/layout/Screen';
import { useAllExhibitions } from '@/src/hooks/useAllExhibitions';

const SKELETON_ROW_COUNT = 5;

const HORIZONTAL_PADDING = 24;
const ROW_GAP = 16;

export default function ExhibitionsScreen() {
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
			return <ListFooter loading accessibilityLabel="전시 목록을 더 불러오는 중" />;
		}

		if (!hasMore) {
			return (
				<Text className="text-gray500 text-[12px] font-pretendard-regular">
					모든 전시를 불러왔어요
				</Text>
			);
		}

		return <ListFooter onPress={loadMore} accessibilityLabel="전시 목록 더 보기" />;
	}

	const renderFooter = useCallback(() => {
		if (items.length === 0) return null;

		return (
			<View className="items-center justify-center" style={{ height: 56 }}>
				{renderFooterContent()}
			</View>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items.length, isLoadingMore, hasMore]);

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
					tone="danger"
					title="전시 정보를 불러오지 못했어요"
					actionLabel="다시 시도"
					onAction={refetch}
					className="py-24"
				/>
			);
		}

		return null;
	}, [status, refetch, columnWidth]);

	return (
		<Screen variant="warm">
			{/* 헤더 */}
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Logo />
				</Screen.Header.Left>
				<Screen.Header.Right>
					<View className="flex-row items-center gap-4">
						<LoginRequiredPressable
							onPress={() => router.push('/bookmark')}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="북마크"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							returnTo="/bookmark"
						>
							<Ionicons name="bookmark-outline" size={24} className="text-gray900" />
						</LoginRequiredPressable>
						<LoginRequiredPressable
							onPress={() => router.push('/notifications')}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="알림"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							returnTo="/notifications"
						>
							<Ionicons name="notifications-outline" size={24} className="text-gray900" />
						</LoginRequiredPressable>
					</View>
				</Screen.Header.Right>
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
