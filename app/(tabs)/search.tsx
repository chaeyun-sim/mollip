import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/common/SearchBar';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchFilterBar } from '@/src/components/search/SearchFilterBar';
import { ExcludeWordsModal } from '@/src/components/search/ExcludeWordsModal';
import { ExhibitionResultCard } from '@/src/components/search/ExhibitionResultCard';
import { useExhibitionSearch, type SearchResult } from '@/src/hooks/useExhibitionSearch';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useRecentSearchStore } from '@/src/store/recentSearchStore';
import { useAuthStore } from '@/src/store/authStore';

const FIXED_TAGS = ['문화유산', '소장품전', '사유', '과학', '현대미술', '사진', '조각', '드로잉'];

const PAGE_SIZE = 20;

const ITEM_ENTERING = FadeIn.duration(220);
const ITEM_EXITING = FadeOut.duration(160);
// 스프링 대신 시간 기반 — 오버슈트(바운스) 없음
const ITEM_LAYOUT = LinearTransition.duration(200);

type ResultListItem = { kind: 'section'; label: string } | { kind: 'result'; result: SearchResult };

export default function SearchScreen() {
	const router = useRouter();
	const { q } = useLocalSearchParams<{ q?: string }>();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showExcludeModal, setShowExcludeModal] = useState(false);
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

	const user = useAuthStore((s) => s.user);
	const { preferredGenres } = usePreferences(user?.id);

	const {
		searchText,
		debouncedSearchText,
		setSearchText,
		commitSearchText,
		statusFilters,
		toggleStatusFilter,
		filterDate,
		setFilterDate,
		excludedWords,
		addExcludedWord,
		removeExcludedWord,
		clearExcludedWords,
		freeOnly,
		toggleFreeOnly,
		hasLocation,
		results,
		popularTags,
	} = useExhibitionSearch();

	const recentWords = useRecentSearchStore((s) => s.words);
	const addRecent = useRecentSearchStore((s) => s.add);
	const removeRecent = useRecentSearchStore((s) => s.remove);
	const clearRecent = useRecentSearchStore((s) => s.clear);

	// 상세 화면 태그 탭 등 외부에서 ?q= 파라미터로 들어오면 디바운스 없이 바로 검색 반영
	useEffect(() => {
		if (q) commitSearchText(q);
	}, [q, commitSearchText]);

	// 필터 변경 시 무한스크롤 위치 초기화
	useEffect(() => {
		requestAnimationFrame(() => {
			setVisibleCount(PAGE_SIZE);
		});
	}, [debouncedSearchText, statusFilters, filterDate, freeOnly]);

	const handlePressExhibition = useCallback(
		(id: string) => router.push(`/(explore)/${id}`),
		[router],
	);

	const handleSubmitSearch = useCallback(() => {
		addRecent(searchText);
	}, [addRecent, searchText]);

	const handlePressRecent = useCallback(
		(word: string) => {
			commitSearchText(word); // 디바운스 없이 즉시 필터 반영
			addRecent(word);
			Keyboard.dismiss();
		},
		[commitSearchText, addRecent],
	);

	// 태그 탭은 제안이므로 최근 검색어에 쌓지 않음
	const handlePressTag = useCallback(
		(tag: string) => {
			commitSearchText(tag);
			Keyboard.dismiss();
		},
		[commitSearchText],
	);

	const handleLoadMore = useCallback(() => {
		setVisibleCount((prev) => prev + PAGE_SIZE);
	}, []);

	// 취향 매칭: 선호 장르가 전시 genre 또는 tags에 포함되는 경우
	const preferredResults = useMemo(() => {
		if (!preferredGenres.length) return [];
		return results.filter((r) =>
			preferredGenres.some((g) => {
				const gLower = g.toLowerCase();
				const genre = r.exhibition.genre?.toLowerCase() ?? '';
				const tags = r.exhibition.tags?.map((t) => t.toLowerCase()) ?? [];
				return genre.includes(gLower) || tags.some((t) => t.includes(gLower));
			}),
		);
	}, [results, preferredGenres]);

	const preferredSet = useMemo(
		() => new Set(preferredResults.map((r) => r.exhibition.id)),
		[preferredResults],
	);

	const otherResults = useMemo(
		() => results.filter((r) => !preferredSet.has(r.exhibition.id)),
		[results, preferredSet],
	);

	const showSections = preferredResults.length > 0 && otherResults.length > 0;

	const displayName =
		(user?.user_metadata?.full_name as string | undefined) ??
		(user?.user_metadata?.name as string | undefined) ??
		null;

	const listData = useMemo<ResultListItem[]>(() => {
		if (!showSections) {
			return results.slice(0, visibleCount).map((r) => ({ kind: 'result' as const, result: r }));
		}
		return [
			{
				kind: 'section',
				label: displayName ? `${displayName}님이 관심있어할 것 같아요!` : '취향 맞춤 전시',
			},
			...preferredResults.map((r) => ({ kind: 'result' as const, result: r })),
			{ kind: 'section', label: '전체' },
			...otherResults.slice(0, visibleCount).map((r) => ({ kind: 'result' as const, result: r })),
		];
	}, [showSections, results, visibleCount, preferredResults, otherResults, displayName]);

	const hasMore = showSections ? visibleCount < otherResults.length : visibleCount < results.length;

	const keyExtractor = useCallback(
		(item: ResultListItem, index: number) =>
			item.kind === 'section' ? `section-${index}` : item.result.exhibition.id,
		[],
	);

	function renderItem({ item }: { item: ResultListItem }) {
		if (item.kind === 'section') {
			return (
				<Text className="text-primary text-[16px] font-pretendard-bold">
					{item.label}
				</Text>
			);
		}
		return (
			<Animated.View entering={ITEM_ENTERING} exiting={ITEM_EXITING} layout={ITEM_LAYOUT}>
				<ExhibitionResultCard result={item.result} onPress={handlePressExhibition} />
			</Animated.View>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Logo />
			</Screen.Header>

			{/* 검색바 */}
			<SearchBar
				value={searchText}
				onChangeText={setSearchText}
				onSubmitEditing={handleSubmitSearch}
				placeholder="전시·미술관·작가 검색"
				variant="tonal"
			/>

			{/* 필터 칩 */}
			{debouncedSearchText && (
				<View className="mt-3 mb-6">
					<SearchFilterBar
						statusFilters={statusFilters}
						onToggleStatus={toggleStatusFilter}
						freeOnly={freeOnly}
						onToggleFree={toggleFreeOnly}
						filterDate={filterDate}
						onPressDate={() => setShowDatePicker(true)}
						excludedCount={excludedWords.length}
						onPressExclude={() => setShowExcludeModal(true)}
					/>
				</View>
			)}

			{!debouncedSearchText ? (
				/* 검색 전 — 추천 태그 + 최근 검색어 */
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 48 }}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
				>
					<View className="mt-7">
						<Text className="text-primary text-[16px] mb-3 font-pretendard-bold">추천 태그</Text>
						<View className="flex-row flex-wrap gap-2">
							{FIXED_TAGS.map((tag) => (
								<Pressable
									key={tag}
									onPress={() => handlePressTag(tag)}
									accessibilityLabel={`${tag} 태그로 검색`}
									accessibilityRole="button"
									className="rounded-full bg-bg-tonal px-3.5 py-2"
									style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								>
									<Text className="text-secondary text-[13px] font-pretendard-medium">{tag}</Text>
								</Pressable>
							))}
						</View>
					</View>

					{recentWords.length > 0 && (
						<View className="mt-7">
							<View className="flex-row items-center justify-between mb-2">
								<Text className="text-primary text-[16px] font-pretendard-bold">최근 검색</Text>
								<Pressable
									onPress={clearRecent}
									hitSlop={8}
									accessibilityLabel="최근 검색어 전체 삭제"
									accessibilityRole="button"
								>
									<Text className="text-muted text-[13px] font-pretendard-regular">전체 삭제</Text>
								</Pressable>
							</View>
							{recentWords.map((word) => (
								<View key={word} className="flex-row items-center gap-2.5 py-3">
									<Ionicons name="time-outline" size={15} className="text-muted" />
									<Pressable
										onPress={() => handlePressRecent(word)}
										accessibilityLabel={`${word} 검색`}
										accessibilityRole="button"
										className="flex-1"
									>
										<Text className="text-[#44403C] text-[15px] font-pretendard-regular">
											{word}
										</Text>
									</Pressable>
									<Pressable
										onPress={() => removeRecent(word)}
										hitSlop={8}
										accessibilityLabel={`최근 검색어 ${word} 삭제`}
										accessibilityRole="button"
									>
										<Ionicons name="close" size={15} color="#D6D3D1" />
									</Pressable>
								</View>
							))}
						</View>
					)}
				</ScrollView>
			) : (
				/* 검색 후 — 무한스크롤 결과 */
				<FlatList
					data={listData}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					onEndReached={hasMore ? handleLoadMore : undefined}
					onEndReachedThreshold={0.3}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 48 }}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					ItemSeparatorComponent={() => <View className="h-5" />}
					ListHeaderComponent={
						<View className="flex-row items-end justify-between mb-4">
							<Text className="text-muted text-[13px] font-pretendard-regular">
								{results.length}건{hasLocation ? ' · 가까운 순' : ''}
							</Text>
						</View>
					}
					ListEmptyComponent={
						<View className="items-center py-16 gap-2">
							<Text className="text-secondary text-[15px] font-pretendard-semibold">
								조건에 맞는 전시가 없어요
							</Text>
							<Text className="text-muted text-[13px] font-pretendard-regular">
								검색어나 필터를 조정해 보세요
							</Text>
						</View>
					}
				/>
			)}

			<DatePickerModal
				visible={showDatePicker}
				value={filterDate ?? new Date()}
				onChange={setFilterDate}
				onDismiss={() => setShowDatePicker(false)}
				onReset={() => setFilterDate(null)}
				resetLabel="날짜 필터 해제"
			/>

			<ExcludeWordsModal
				visible={showExcludeModal}
				words={excludedWords}
				onAdd={addExcludedWord}
				onRemove={removeExcludedWord}
				onClearAll={clearExcludedWords}
				onDismiss={() => setShowExcludeModal(false)}
			/>
		</Screen>
	);
}
