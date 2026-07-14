import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { DiaryCalendar } from '@/src/components/archive/DiaryCalendar';
import { Screen } from '@/src/components/layout/Screen';
import { useDiaryStore } from '@/src/store/diaryStore';
import { SERVICE_NAME } from '@/src/constants/service-name';

export default function ArchiveScreen() {
	const router = useRouter();
	const entries = useDiaryStore(s => s.entries);

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
					<View className='flex-row items-center gap-1'>
						<Ionicons name='book-outline' size={13} color='#9CA3AF' />
						<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
							{entryCount > 0 ? `기록 ${entryCount}개` : '나의 관람 기록'}
						</Text>
					</View>
					<Text className='mt-2 text-gray-900 text-[38px] leading-[42px] font-hahmlet-bold'>
						관람 다이어리
					</Text>
				</View>

				{/* 캘린더 카드 */}
				<View className='rounded-3xl bg-[#F2EFE9] px-4 pb-5 pt-5'>
					<DiaryCalendar
						year={year}
						month={month}
						markedDates={Object.keys(entries)}
						onSelectDate={handleSelectDate}
						onChangeMonth={handleChangeMonth}
					/>
				</View>

				<Text className='mt-4 text-center text-[12px] font-pretendard-regular text-gray-400'>
					날짜를 선택하면 그날의 기록이 열립니다
				</Text>
			</ScrollView>
		</Screen>
	);
}
