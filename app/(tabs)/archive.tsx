import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiaryCalendar } from '@/src/components/archive/DiaryCalendar';
import { GridPaper } from '@/src/components/archive/GridPaper';
import { WashiTape } from '@/src/components/archive/WashiTape';
import { useDiaryStore } from '@/src/store/diaryStore';

const HAND = { fontFamily: 'NanumPenScript_400Regular' } as const;

export default function ArchiveScreen() {
	const router = useRouter();
	const entries = useDiaryStore((s) => s.entries);

	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1); // 1~12

	const handleChangeMonth = useCallback((offset: -1 | 1) => {
		setMonth((prev) => {
			const next = prev + offset;
			if (next < 1) {
				setYear((y) => y - 1);
				return 12;
			}
			if (next > 12) {
				setYear((y) => y + 1);
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

	return (
		<SafeAreaView className='flex-1' style={{ backgroundColor: '#C4CFD3' }} edges={['top']}>
			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 }}
				showsVerticalScrollIndicator={false}
			>
				{/* 다이어리 표지 */}
				<View
					className='overflow-visible rounded-r-2xl rounded-l-[4px] px-6 pb-8 pt-12'
					style={{
						backgroundColor: '#5E7263',
						shadowColor: '#2E3A34',
						shadowOpacity: 0.35,
						shadowRadius: 12,
						shadowOffset: { width: 0, height: 6 },
						elevation: 8,
					}}
				>
					{/* 책등 스티치 */}
					<View className='absolute bottom-0 left-0 top-0 w-4 rounded-l-[4px] bg-black/15' />
					<View className='absolute bottom-3 left-[7px] top-3 w-0 border-l border-dashed border-white/35' />

					{/* 표지 라벨 스티커 */}
					<View
						className='items-center self-center rounded-sm bg-[#FFFEF9] px-8 py-4'
						style={{
							transform: [{ rotate: '-1.5deg' }],
							shadowColor: '#2E3A34',
							shadowOpacity: 0.2,
							shadowRadius: 4,
							shadowOffset: { width: 0, height: 2 },
							elevation: 3,
						}}
					>
						<WashiTape
							style={{ position: 'absolute', top: -12, alignSelf: 'center' }}
							width={72}
							rotate={2}
							color='rgba(240, 200, 121, 0.55)'
						/>
						<Text className='text-[13px] tracking-[3px] text-[#A8A29E]' style={{ fontFamily: 'Pretendard-Medium' }}>
							MUSEUM DIARY
						</Text>
						<Text className='mt-1 text-[32px] leading-9 text-[#37342F]' style={HAND}>
							나의 관람 다이어리
						</Text>
					</View>

					{/* 캘린더 속지 */}
					<View
						className='mt-8 rounded-[3px] bg-[#FFFEF9] px-4 pb-4 pt-5'
						style={{
							transform: [{ rotate: '0.6deg' }],
							shadowColor: '#2E3A34',
							shadowOpacity: 0.2,
							shadowRadius: 5,
							shadowOffset: { width: 0, height: 3 },
							elevation: 4,
						}}
					>
						<GridPaper />
						<WashiTape
							style={{ position: 'absolute', top: -9, left: 14 }}
							width={64}
							rotate={-6}
						/>
						<DiaryCalendar
							year={year}
							month={month}
							markedDates={Object.keys(entries)}
							onSelectDate={handleSelectDate}
							onChangeMonth={handleChangeMonth}
						/>
						<Text className='mt-3 text-center text-[15px] text-[#A8A29E]' style={HAND}>
							날짜를 누르면 그날의 일기가 열려요
						</Text>
					</View>

					{/* 하단 장식 */}
					<View className='mt-7 flex-row items-center justify-end'>
						<View className='mr-2 h-3 w-3 rounded-full bg-[#F2C879]/80' />
						<View className='mr-3 h-2 w-2 rounded-full bg-[#D77A61]/80' />
						<Text className='text-[15px] tracking-widest text-white/60' style={HAND}>
							with AI docent
						</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
