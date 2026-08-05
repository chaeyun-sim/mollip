import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
	FadeIn,
	FadeOut,
	LinearTransition,
} from 'react-native-reanimated';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/common/SearchBar';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchFilterBar } from '@/src/components/search/SearchFilterBar';
import { ExcludeWordsModal } from '@/src/components/search/ExcludeWordsModal';
import { ExhibitionResultCard } from '@/src/components/search/ExhibitionResultCard';
import { useExhibitionSearch } from '@/src/hooks/useExhibitionSearch';
import { useRecentSearchStore } from '@/src/store/recentSearchStore';
import { getPopularTags } from '@/src/utils/exhibitionSearch';

const ITEM_ENTERING = FadeIn.duration(220);
const ITEM_EXITING = FadeOut.duration(160);
// 스프링 대신 시간 기반 — 오버슈트(바운스) 없음
const ITEM_LAYOUT = LinearTransition.duration(200);

// 정적 데이터라 모듈 로드 시 1회 계산
const POPULAR_TAGS = getPopularTags(8);

export default function SearchScreen() {
	const router = useRouter();
	const { q } = useLocalSearchParams<{ q?: string }>();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showExcludeModal, setShowExcludeModal] = useState(false);

	const {
		searchText,
		setSearchText,
		commitSearchText,
		statusFilters,
		toggleStatusFilter,
		filterDate,
		setFilterDate,
		excludedWords,
		addExcludedWord,
		removeExcludedWord,
		freeOnly,
		toggleFreeOnly,
		hasLocation,
		results,
	} = useExhibitionSearch();

	const recentWords = useRecentSearchStore((s) => s.words);
	const addRecent = useRecentSearchStore((s) => s.add);
	const removeRecent = useRecentSearchStore((s) => s.remove);
	const clearRecent = useRecentSearchStore((s) => s.clear);

	// 상세 화면 태그 탭 등 외부에서 ?q= 파라미터로 들어오면 디바운스 없이 바로 검색 반영
	useEffect(() => {
		if (q) commitSearchText(q);
	}, [q, commitSearchText]);

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

	return (
		<Screen className='bg-white'>
			<StatusBar style='dark' />

			<Screen.Header>
				<Screen.Header.Logo />
			</Screen.Header>

			{/* 검색바 */}
			<SearchBar
				value={searchText}
				onChangeText={setSearchText}
				onSubmitEditing={handleSubmitSearch}
				placeholder='전시·미술관·작가 검색'
				variant='tonal'
			/>

			{/* 필터 칩 */}
			{searchText && (
				<View className='mt-3'>
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

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 48 }}
				keyboardShouldPersistTaps='handled'
				keyboardDismissMode='on-drag'
			>
				{!searchText ? (
					/* 검색 전 — 추천 태그 + 최근 검색어 */
					<View>
						<View className='mt-7'>
							<Text className='text-[#1C1917] text-[16px] mb-3 font-pretendard-bold'>
								추천 태그
							</Text>
							<View className='flex-row flex-wrap gap-2'>
								{POPULAR_TAGS.map((tag) => (
									<Pressable
										key={tag}
										onPress={() => handlePressTag(tag)}
										accessibilityLabel={`${tag} 태그로 검색`}
										accessibilityRole='button'
										className='rounded-full bg-[#F2EFE9] px-3.5 py-2'
										style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
									>
										<Text className='text-[#57534E] text-[13px] font-pretendard-medium'>
											{tag}
										</Text>
									</Pressable>
								))}
							</View>
						</View>

						{recentWords.length > 0 && (
							<View className='mt-7'>
								<View className='flex-row items-center justify-between mb-2'>
									<Text className='text-[#1C1917] text-[16px] font-pretendard-bold'>
										최근 검색
									</Text>
									<Pressable
										onPress={clearRecent}
										hitSlop={8}
										accessibilityLabel='최근 검색어 전체 삭제'
										accessibilityRole='button'
									>
										<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
											전체 삭제
										</Text>
									</Pressable>
								</View>
								{recentWords.map((word) => (
									<View key={word} className='flex-row items-center gap-2.5 py-3'>
										<Ionicons name='time-outline' size={15} color='#A8A29E' />
										<Pressable
											onPress={() => handlePressRecent(word)}
											accessibilityLabel={`${word} 검색`}
											accessibilityRole='button'
											className='flex-1'
										>
											<Text className='text-[#44403C] text-[15px] font-pretendard-regular'>
												{word}
											</Text>
										</Pressable>
										<Pressable
											onPress={() => removeRecent(word)}
											hitSlop={8}
											accessibilityLabel={`최근 검색어 ${word} 삭제`}
											accessibilityRole='button'
										>
											<Ionicons name='close' size={15} color='#D6D3D1' />
										</Pressable>
									</View>
								))}
							</View>
						)}
					</View>
				) : (
					/* 검색 후 — 검색 결과 */
					<View className='mt-7'>
						<View className='flex-row items-end justify-between mb-3'>
							<Text className='text-[#1C1917] text-[18px] font-pretendard-bold'>
								검색 결과
							</Text>
							<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
								{results.length}건{hasLocation ? ' · 가까운 순' : ''}
							</Text>
						</View>

						{results.length === 0 ? (
							<View className='items-center py-16 gap-2'>
								<Text className='text-[#57534E] text-[15px] font-pretendard-semibold'>
									조건에 맞는 전시가 없어요
								</Text>
								<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
									검색어나 필터를 조정해 보세요
								</Text>
							</View>
						) : (
							<View className='gap-5'>
								{results.map((r) => (
									<Animated.View
										key={r.exhibition.id}
										entering={ITEM_ENTERING}
										exiting={ITEM_EXITING}
										layout={ITEM_LAYOUT}
									>
										<ExhibitionResultCard result={r} onPress={handlePressExhibition} />
									</Animated.View>
								))}
							</View>
						)}
					</View>
				)}
			</ScrollView>

			<DatePickerModal
				visible={showDatePicker}
				value={filterDate ?? new Date()}
				onChange={setFilterDate}
				onDismiss={() => setShowDatePicker(false)}
				onReset={() => setFilterDate(null)}
				resetLabel='날짜 필터 해제'
			/>

			<ExcludeWordsModal
				visible={showExcludeModal}
				words={excludedWords}
				onAdd={addExcludedWord}
				onRemove={removeExcludedWord}
				onDismiss={() => setShowExcludeModal(false)}
			/>
		</Screen>
	);
}
