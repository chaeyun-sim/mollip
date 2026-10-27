import { trackExhibitionSelection, trackSearchSubmitted } from '@/src/lib/analytics';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/common/SearchBar';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchEmptyIllustration } from '@/src/components/illustration/SearchEmptyIllustration';
import { Result } from '@/src/components/common/Result';
import { SearchFilterBar } from '@/src/components/search/SearchFilterBar';
import { ExcludeWordsModal } from '@/src/components/search/ExcludeWordsModal';
import { ExhibitionResultCard } from '@/src/components/search/ExhibitionResultCard';
import { ExhibitionResultCardSkeleton } from '@/src/components/search/ExhibitionResultCardSkeleton';
import { useExhibitionSearch, type SearchResult } from '@/src/hooks/useExhibitionSearch';
import { usePreferences } from '@/src/hooks/queries/usePreferences';
import { useRecentSearchStore } from '@/src/store/recentSearchStore';
import { useAuthStore } from '@/src/store/authStore';
import { ScreenHeader } from '@/src/components/layout/ScreenHeader';

const FIXED_TAGS = ['문화유산', '소장품전', '사유', '과학', '현대미술', '사진', '조각', '드로잉'];

const PAGE_SIZE = 20;

const ITEM_ENTERING = FadeIn.duration(220);
const ITEM_EXITING = FadeOut.duration(160);
// 스프링 대신 시간 기반 — 오버슈트(바운스) 없음
const ITEM_LAYOUT = LinearTransition.duration(200);

type ResultListItem = { kind: 'section'; label: string } | { kind: 'result'; result: SearchResult };

export default function SearchScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const { q, closing } = useLocalSearchParams<{ q?: string; closing?: string }>();
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
		closingSoonOnly,
		setClosingSoonOnly,
		toggleClosingSoonOnly,
		hasLocation,
		results,
		isLoading,
	} = useExhibitionSearch();

	const { recentWords, addRecent, removeRecent, clearRecent } = useRecentSearchStore(
		useShallow((s) => ({
			recentWords: s.words,
			addRecent: s.add,
			removeRecent: s.remove,
			clearRecent: s.clear,
		})),
	);

	// 상세 화면 태그 탭 등 외부에서 ?q= 파라미터로 들어오면 디바운스 없이 바로 검색 반영
	useEffect(() => {
		if (q) commitSearchText(q);
	}, [q, commitSearchText]);

	// 홈 "곧 막을 내려요" 전체 보기(?closing=1)로 들어오면 마감 임박 필터를 켠 채 시작
	useEffect(() => {
		if (closing === '1') setClosingSoonOnly(true);
	}, [closing, setClosingSoonOnly]);

	// 검색어가 없어도 마감 임박 필터가 켜져 있으면 결과 목록을 보여준다
	const isBrowsing = Boolean(debouncedSearchText) || closingSoonOnly;
	const resolveSortLabel = () => {
		if (closingSoonOnly) return t('search.sort_closing_soon');

		if (hasLocation) return t('search.sort_nearest');

		return '';
	};
	const sortLabel = resolveSortLabel();

	// 필터 변경 시 무한스크롤 위치 초기화
	useEffect(() => {
		requestAnimationFrame(() => {
			setVisibleCount(PAGE_SIZE);
		});
	}, [debouncedSearchText, statusFilters, filterDate, freeOnly, closingSoonOnly]);

	const handlePressExhibition = useCallback(
		(id: string) => {
			void trackExhibitionSelection(id);
			router.push(`/(explore)/${id}`);
		},
		[router],
	);

	const handleSubmitSearch = useCallback(() => {
		addRecent(searchText);
		if (searchText.trim()) void trackSearchSubmitted(searchText.trim().length);
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
				label: displayName
					? t('search.personalized_section', { name: displayName })
					: t('search.taste_section'),
			},
			...preferredResults.map((r) => ({ kind: 'result' as const, result: r })),
			{ kind: 'section', label: t('search.all_section') },
			...otherResults.slice(0, visibleCount).map((r) => ({ kind: 'result' as const, result: r })),
		];
	}, [showSections, results, visibleCount, preferredResults, otherResults, displayName, t]);

	const hasMore = showSections ? visibleCount < otherResults.length : visibleCount < results.length;

	const keyExtractor = useCallback(
		(item: ResultListItem, index: number) =>
			item.kind === 'section' ? `section-${index}` : item.result.exhibition.id,
		[],
	);

	function renderItem({ item }: { item: ResultListItem }) {
		if (item.kind === 'section') {
			return <Text className="text-gray900 text-[16px] font-pretendard-bold">{item.label}</Text>;
		}
		return (
			<Animated.View entering={ITEM_ENTERING} exiting={ITEM_EXITING} layout={ITEM_LAYOUT}>
				<ExhibitionResultCard
					result={item.result}
					onPress={handlePressExhibition}
					closingSoon={closingSoonOnly}
				/>
			</Animated.View>
		);
	}

	return (
		<Screen variant="warm">
			<ScreenHeader className="pb-3">
				<ScreenHeader.Back onPress={() => router.back()} />
			</ScreenHeader>

			<View className="flex-1">
				{/* 검색바 — 홈 검색바와 동일한 상단 여백(pt-1)으로 위치를 맞춰야 sharedTransitionTag가 자연스럽게 이어짐 */}
				<Animated.View sharedTransitionTag="home-search-bar" className="pt-1">
					<SearchBar
						value={searchText}
						onChangeText={setSearchText}
						onSubmitEditing={handleSubmitSearch}
						placeholder={t('search.search_exhibitions_placeholder')}
						variant="tonal"
						autoFocus
					/>
				</Animated.View>

				{/* 필터 칩 */}
				{isBrowsing && (
					<View className="mt-3 mb-6">
						<SearchFilterBar
							statusFilters={statusFilters}
							onToggleStatus={toggleStatusFilter}
							freeOnly={freeOnly}
							onToggleFree={toggleFreeOnly}
							closingSoonOnly={closingSoonOnly}
							onToggleClosingSoon={toggleClosingSoonOnly}
							filterDate={filterDate}
							onPressDate={() => setShowDatePicker(true)}
							excludedCount={excludedWords.length}
							onPressExclude={() => setShowExcludeModal(true)}
						/>
					</View>
				)}

				{!isBrowsing ? (
					/* 검색 전 — 추천 태그 + 최근 검색어 */
					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerClassName="pb-12"
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="on-drag"
					>
						<View className="mt-7">
							<Text className="text-gray900 text-[16px] mb-3 font-pretendard-bold">
								{t('search.recommended_tags')}
							</Text>
							<View className="flex-row flex-wrap gap-2">
								{FIXED_TAGS.map((tag) => (
									<Pressable
										key={tag}
										onPress={() => handlePressTag(tag)}
										accessibilityLabel={t('search.search_tag_a11y', { tag })}
										accessibilityRole="button"
										className="rounded-full border border-secondary/25 bg-transparent px-3.5 py-2"
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
									<Text className="text-gray900 text-[16px] font-pretendard-bold">
										{t('search.recent_searches')}
									</Text>
									<Pressable
										onPress={clearRecent}
										hitSlop={8}
										accessibilityLabel={t('search.clear_all_recent_a11y')}
										accessibilityRole="button"
									>
										<Text className="text-gray500 text-[13px] font-pretendard-regular">
											{t('search.clear_recent')}
										</Text>
									</Pressable>
								</View>
								{recentWords.slice(0, 5).map((word) => (
									<View key={word} className="flex-row items-center gap-2.5 py-3">
										<Ionicons name="time-outline" size={15} className="text-gray500" />
										<Pressable
											onPress={() => handlePressRecent(word)}
											accessibilityLabel={t('search.search_word_a11y', { word })}
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
											accessibilityLabel={t('search.delete_recent_word_a11y', { word })}
											accessibilityRole="button"
										>
											<Ionicons name="close" size={15} color="#D6D3D1" />
										</Pressable>
									</View>
								))}
							</View>
						)}
					</ScrollView>
				) : isLoading && listData.length === 0 ? (
					/* 검색 결과 로딩 중 — 실제 카드와 동일 높이의 스켈레톤 행 */
					<View className="gap-5">
						{Array.from({ length: 5 }).map((_, index) => (
							<ExhibitionResultCardSkeleton key={index} />
						))}
					</View>
				) : (
					/* 검색 후 — 무한스크롤 결과 */
					<FlatList
						data={listData}
						keyExtractor={keyExtractor}
						renderItem={renderItem}
						onEndReached={hasMore ? handleLoadMore : undefined}
						onEndReachedThreshold={0.3}
						showsVerticalScrollIndicator={false}
						contentContainerClassName="pb-12"
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="on-drag"
						ItemSeparatorComponent={() => <View className="h-5" />}
						ListHeaderComponent={
							<View className="flex-row items-end justify-between mb-4">
								<Text className="text-gray500 text-[13px] font-pretendard-regular">
									{t('search.count_results', { count: results.length })}
									{sortLabel}
								</Text>
							</View>
						}
						ListEmptyComponent={
							<Result
								icon="search-outline"
								illustration={<SearchEmptyIllustration width={200} />}
								title={t('search.no_matching_exhibitions')}
								description={t('search.adjust_filters')}
								className="flex-none py-16"
							/>
						}
					/>
				)}
			</View>

			<DatePickerModal
				visible={showDatePicker}
				value={filterDate ?? new Date()}
				onChange={setFilterDate}
				onDismiss={() => setShowDatePicker(false)}
				onReset={() => setFilterDate(null)}
				resetLabel={t('search.clear_date_filter')}
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
