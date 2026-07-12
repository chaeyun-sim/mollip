import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface DiaryCalendarProps {
	year: number;
	month: number; // 1~12
	markedDates: string[]; // 일기가 있는 날짜 키 (YYYY-MM-DD)
	onSelectDate: (dateKey: string) => void;
	onChangeMonth: (offset: -1 | 1) => void;
}

const HAND = { fontFamily: 'NanumPenScript_400Regular' } as const;
const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function toDateKey(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 다이어리 표지에 붙는 손글씨 달력. 날짜를 누르면 해당 일기로 이동한다.
export function DiaryCalendar({
	year,
	month,
	markedDates,
	onSelectDate,
	onChangeMonth,
}: DiaryCalendarProps) {
	const todayKey = toDateKey(
		new Date().getFullYear(),
		new Date().getMonth() + 1,
		new Date().getDate(),
	);

	// 주 단위 2차원 배열 (빈 칸은 null)
	const weeks = useMemo(() => {
		const firstDay = new Date(year, month - 1, 1).getDay();
		const daysInMonth = new Date(year, month, 0).getDate();
		const cells: (number | null)[] = [
			...Array.from({ length: firstDay }, () => null),
			...Array.from({ length: daysInMonth }, (_, i) => i + 1),
		];
		while (cells.length % 7 !== 0) cells.push(null);
		const result: (number | null)[][] = [];
		for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
		return result;
	}, [year, month]);

	return (
		<View>
			{/* 월 네비게이션 */}
			<View className='flex-row items-center justify-between px-1'>
				<Pressable
					onPress={() => onChangeMonth(-1)}
					hitSlop={10}
					accessibilityLabel='이전 달'
					accessibilityRole='button'
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
				>
					<Ionicons name='chevron-back' size={18} color='#78716C' />
				</Pressable>
				<Text className='text-[26px] text-[#37342F]' style={HAND}>
					{year}년 {month}월
				</Text>
				<Pressable
					onPress={() => onChangeMonth(1)}
					hitSlop={10}
					accessibilityLabel='다음 달'
					accessibilityRole='button'
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
				>
					<Ionicons name='chevron-forward' size={18} color='#78716C' />
				</Pressable>
			</View>

			{/* 요일 헤더 */}
			<View className='mt-3 flex-row'>
				{WEEK_LABELS.map((label, i) => (
					<Text
						key={label}
						className={cn(
							'flex-1 text-center text-[16px]',
							i === 0 ? 'text-[#C0564A]' : 'text-[#78716C]',
						)}
						style={HAND}
					>
						{label}
					</Text>
				))}
			</View>

			{/* 날짜 그리드 */}
			{weeks.map((week, wi) => (
				<View key={wi} className='flex-row'>
					{week.map((day, di) => {
						if (day === null) {
							return <View key={`${wi}-${di}`} className='flex-1 py-1.5' />;
						}
						const dateKey = toDateKey(year, month, day);
						const isFuture = dateKey > todayKey;
						const isToday = dateKey === todayKey;
						const hasEntry = markedDates.includes(dateKey);
						return (
							<Pressable
								key={dateKey}
								className='flex-1 items-center py-1.5'
								onPress={() => onSelectDate(dateKey)}
								disabled={isFuture}
								accessibilityLabel={`${month}월 ${day}일 일기 보기`}
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
							>
								<View
									className={cn(
										'h-8 w-8 items-center justify-center rounded-full',
										isToday && 'border-[1.5px] border-[#2F5FA8]',
									)}
								>
									<Text
										className={cn('text-[18px]', {
											'text-[#D6D1C4]': isFuture,
											'text-[#C0564A]': !isFuture && di === 0,
											'text-[#44403C]': !isFuture && di !== 0,
										})}
										style={HAND}
									>
										{day}
									</Text>
								</View>
								{/* 일기가 있는 날 표시 */}
								<View
									className={cn(
										'h-1.5 w-1.5 rounded-full',
										hasEntry ? 'bg-[#2F5FA8]' : 'bg-transparent',
									)}
								/>
							</Pressable>
						);
					})}
				</View>
			))}
		</View>
	);
}
