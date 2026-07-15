import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/common/SearchBar';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchFilterBar } from '@/src/components/search/SearchFilterBar';
import { ExcludeWordsModal } from '@/src/components/search/ExcludeWordsModal';
import { ExhibitionResultCard } from '@/src/components/search/ExhibitionResultCard';
import { useExhibitionSearch } from '@/src/hooks/useExhibitionSearch';
import { useRecentSearchStore } from '@/src/store/recentSearchStore';
import { SERVICE_NAME } from '@/src/constants/service-name';

const ITEM_ENTERING = FadeIn.duration(220);
const ITEM_EXITING = FadeOut.duration(160);
// 스프링 대신 시간 기반 — 오버슈트(바운스) 없음
const ITEM_LAYOUT = LinearTransition.duration(200);

export default function SearchScreen() {
	const router = useRouter();
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
		hasLocation,
		results,
	} = useExhibitionSearch();

	const recentWords = useRecentSearchStore((s) => s.words);
	const addRecent = useRecentSearchStore((s) => s.add);
	const removeRecent = useRecentSearchStore((s) => s.remove);
	const clearRecent = useRecentSearchStore((s) => s.clear);

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

	return (
		<Screen className='bg-white'>
			<StatusBar style='dark' />

			<Screen.Header>
				<Screen.Header.Left>
					<Text className='text-gray-900 text-[22px] font-pretendard-bold'>
						{SERVICE_NAME}
					</Text>
				</Screen.Header.Left>
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
			<View className='mt-3'>
				<SearchFilterBar
					statusFilters={statusFilters}
					onToggleStatus={toggleStatusFilter}
					filterDate={filterDate}
					onPressDate={() => setShowDatePicker(true)}
					excludedCount={excludedWords.length}
					onPressExclude={() => setShowExcludeModal(true)}
				/>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 48 }}
				keyboardShouldPersistTaps='handled'
				keyboardDismissMode='on-drag'
			>
				{!searchText ? (
					/* 검색 전 — 최근 검색어 */
					recentWords.length > 0 ? (
						<View className='mt-7'>
							<View className='flex-row items-center justify-between mb-2'>
								<Text
									className='text-[#1C1917] text-[18px]'
									style={{ fontFamily: 'Pretendard-Bold' }}
								>
									최근 검색
								</Text>
								<Pressable
									onPress={clearRecent}
									hitSlop={8}
									accessibilityLabel='최근 검색어 전체 삭제'
									accessibilityRole='button'
								>
									<Text
										className='text-[#A8A29E] text-[13px]'
										style={{ fontFamily: 'Pretendard-Regular' }}
									>
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
										<Text
											className='text-[#44403C] text-[15px]'
											style={{ fontFamily: 'Pretendard-Regular' }}
										>
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
					) : (
						<View className='items-center py-20 gap-2'>
							<Ionicons name='search-outline' size={28} color='#D6D3D1' />
							<Text
								className='text-[#A8A29E] text-[14px]'
								style={{ fontFamily: 'Pretendard-Regular' }}
							>
								전시·미술관·작가를 검색해 보세요
							</Text>
						</View>
					)
				) : (
					/* 검색 후 — 검색 결과 */
					<View className='mt-7'>
						<View className='flex-row items-end justify-between mb-3'>
							<Text
								className='text-[#1C1917] text-[18px]'
								style={{ fontFamily: 'Pretendard-Bold' }}
							>
								검색 결과
							</Text>
							<Text
								className='text-[#A8A29E] text-[13px]'
								style={{ fontFamily: 'Pretendard-Regular' }}
							>
								{results.length}건{hasLocation ? ' · 가까운 순' : ''}
							</Text>
						</View>

						{results.length === 0 ? (
							<View className='items-center py-16 gap-2'>
								<Text
									className='text-[#57534E] text-[15px]'
									style={{ fontFamily: 'Pretendard-SemiBold' }}
								>
									조건에 맞는 전시가 없어요
								</Text>
								<Text
									className='text-[#A8A29E] text-[13px]'
									style={{ fontFamily: 'Pretendard-Regular' }}
								>
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
