import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { DiaryCalendar, type DayImage } from '@/src/components/archive/DiaryCalendar';
import { SavedExhibitions } from '@/src/components/archive/SavedExhibitions';
import { Screen } from '@/src/components/layout/Screen';
import { cn } from '@/src/lib/cn';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useDiaryStore } from '@/src/store/diaryStore';
import { useVisitStore } from '@/src/store/visitStore';
import { getExhibition } from '@/src/data/exhibitions';
import { SERVICE_NAME } from '@/src/constants/service-name';

type ArchiveTab = 'diary' | 'saved';

const SEGMENTS: { key: ArchiveTab; label: string }[] = [
	{ key: 'diary', label: '관람 다이어리' },
	{ key: 'saved', label: '저장한 전시' },
];

export default function ArchiveScreen() {
	const router = useRouter();
	const entries = useDiaryStore(s => s.entries);
	const [tab, setTab] = useState<ArchiveTab>('diary');

	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1); // 1~12

	const handleChangeMonth = useCallback((offset: -1 | 1) => {
		setMonth(prev => {
			const next = prev + offset;
			if (next < 1) {
				setYear(y => y - 1);
				return 12;
			}
			if (next > 12) {
				setYear(y => y + 1);
				return 1;
			}
			return next;
		});
	}, []);

	const handleSelectDate = useCallback(
		(dateKey: string) => {
			router.push(`/diary/${dateKey}`);
		},
		[router],
	);

	const handlePressExhibition = useCallback(
		(id: string) => {
			router.push(`/(explore)/${id}`);
		},
		[router],
	);

	const visits = useVisitStore(s => s.visits);

	// 선택 가능한 날짜 = 관람 기록이 있거나 일기가 있는 날
	const markedDates = useMemo(
		() => [...new Set([...Object.keys(visits), ...Object.keys(entries)])],
		[visits, entries],
	);

	// 날짜 셀 이미지: 관람 전시 포스터 → 본 그림 순으로 사용
	const dayImages = useMemo(() => {
		const map: Record<string, DayImage> = {};
		for (const [dateKey, visit] of Object.entries(visits)) {
			const exhibition = visit.exhibitionId ? getExhibition(visit.exhibitionId) : undefined;
			const listenedImageUrl = visit.listened.find(l => l.imageUrl)?.imageUrl;
			const source =
				exhibition?.posterImage ??
				(listenedImageUrl ? { uri: listenedImageUrl } : undefined);
			if (source || exhibition?.posterColor) {
				map[dateKey] = { source, color: exhibition?.posterColor };
			}
		}
		return map;
	}, [visits]);

	const entryCount = Object.keys(entries).length;

	return (
		<Screen className='bg-white'>
			<StatusBar style='dark' />

			<Screen.Header>
				<Screen.Header.Left>
					<Text className='text-gray-900 text-[22px] font-pretendard-bold'>{SERVICE_NAME}</Text>
				</Screen.Header.Left>
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				{/* 타이틀 */}
				<View className='gap-1.5 mb-5'>
					{/* <View className='flex-row items-center gap-1'>
						<Ionicons
							name={tab === 'diary' ? 'book-outline' : 'bookmark-outline'}
							size={13}
							color='#9CA3AF'
						/>
						<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
							{tab === 'diary'
								? entryCount > 0
									? `기록 ${entryCount}개`
									: '나의 관람 기록'
								: bookmarkCount > 0
									? `저장 ${bookmarkCount}개`
									: '보고 싶은 전시 모음'}
						</Text>
					</View> */}
					{/* <Text className='mt-2 text-gray-900 text-[38px] leading-[42px] font-hahmlet-bold'>
						{tab === 'diary' ? '관람 다이어리' : '저장한 전시'}
					</Text> */}
				</View>

				{/* 세그먼트 토글 */}
				<View className='flex-row rounded-full bg-[#F2EFE9] p-1 mb-5'>
					{SEGMENTS.map(seg => {
						const selected = tab === seg.key;
						return (
							<Pressable
								key={seg.key}
								onPress={() => setTab(seg.key)}
								accessibilityLabel={seg.label}
								accessibilityRole='button'
								accessibilityState={{ selected }}
								className={cn(
									'flex-1 items-center justify-center rounded-full py-2',
									selected && 'bg-white',
								)}
								style={
									selected
										? {
												shadowColor: '#1C1917',
												shadowOpacity: 0.08,
												shadowRadius: 4,
												shadowOffset: { width: 0, height: 1 },
											}
										: undefined
								}
							>
								<Text
									className={cn(
										'text-[14px]',
										selected ? 'text-[#1C1917]' : 'text-[#A8A29E]',
									)}
									style={{
										fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
									}}
								>
									{seg.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{tab === 'diary' ? (
					<>
						{/* 캘린더 카드 */}
						<View className='rounded-3xl bg-[#F2EFE9] px-4 pb-5 pt-5'>
							<DiaryCalendar
								year={year}
								month={month}
								markedDates={markedDates}
								dayImages={dayImages}
								onSelectDate={handleSelectDate}
								onChangeMonth={handleChangeMonth}
							/>
						</View>

						<Text className='mt-4 text-center text-[12px] font-pretendard-regular text-gray-400'>
							날짜를 선택하면 그날의 기록이 열립니다
						</Text>
					</>
				) : (
					<SavedExhibitions onPressExhibition={handlePressExhibition} />
				)}
			</ScrollView>
		</Screen>
	);
}
