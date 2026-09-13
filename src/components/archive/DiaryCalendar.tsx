import { cn } from '@/src/lib/cn';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { DiaryStampCell } from '@/src/components/archive/DiaryStampCell';
import { WEEKDAYS } from '@/src/constants/week';

/** 캘린더 셀 날짜 키 — visitStore의 dateKey(YYYY-MM-DD, todayKey())와 동일 포맷으로 맞춘다 */
function isoDateKey(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 달마다 주(행) 수가 4~6개로 다르다(예: 2026년 5월은 6주) — 행 높이를 고정하면 6주짜리 달만 화면을
// 넘긴다. 그래서 "그리드 전체 높이"를 고정하고 행 높이를 주 수에 맞춰 나눈다 — 6주 달이 기준(가장
// 촘촘)이고, 주가 적은 달은 남는 공간만큼 우표가 더 커진다.
const GRID_TOTAL_HEIGHT = 450;
const ROW_GAP = 6;

export interface DayImage {
	source?: ImageSourcePropType;
	color?: string;
}

interface DiaryCalendarProps {
	year: number;
	month: number;
	markedDates: string[];
	dayImages?: Record<string, DayImage>;
	onSelectDate: (dateKey: string) => void;
	onChangeMonth: (offset: -1 | 1) => void;
}


function rotationForDateKey(dateKey: string): number {
	const seed = dateKey
		.replace(/-/g, '')
		.split('')
		.reduce((a, c) => a + c.charCodeAt(0), 0);
	return (seed % 13) - 6;
}

export function DiaryCalendar({
	year,
	month,
	markedDates,
	dayImages,
	onSelectDate,
	onChangeMonth,
}: DiaryCalendarProps) {
	const today = new Date().toISOString().slice(0, 10);
	const now = new Date();
	const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

	const weeks = useMemo(() => {
		const firstDay = new Date(year, month - 1, 1).getDay();
		const daysInMonth = new Date(year, month, 0).getDate();
		const prevDaysInMonth = new Date(year, month - 1, 0).getDate();
		const cells: { day: number; inMonth: boolean }[] = [
			...Array.from({ length: firstDay }, (_, i) => ({
				day: prevDaysInMonth - firstDay + i + 1,
				inMonth: false,
			})),
			...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, inMonth: true })),
		];
		let nextDay = 1;
		while (cells.length % 7 !== 0) cells.push({ day: nextDay++, inMonth: false });
		const result: { day: number; inMonth: boolean }[][] = [];
		for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
		return result;
	}, [year, month]);

	const rowHeight = useMemo(
		() => (GRID_TOTAL_HEIGHT - ROW_GAP * (weeks.length - 1)) / weeks.length,
		[weeks.length],
	);

	return (
		<View className="w-full px-1 pt-2 pb-4">
			{/* 헤더 — 큰 월 숫자 + 연도 + 이전/다음 달 */}
			<View className="flex-row items-start justify-between">
				<View className="flex-row items-end gap-2">
					<Text
						className="font-hahmlet-bold text-gray900 tracking-[-1px]"
						style={{ fontSize: 56, lineHeight: 58 }}
					>
						{String(month).padStart(2, '0')}
					</Text>
					<Text className="pb-1.5 text-[13px] text-gray500 font-pretendard-medium">{year}</Text>
				</View>
				<View className="flex-row items-center gap-2 pt-1.5">
					<Pressable
						onPress={() => onChangeMonth(-1)}
						hitSlop={10}
						accessibilityLabel="이전 달"
						accessibilityRole="button"
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
						className="bg-gray200 h-8 w-8 rounded-2xl items-center justify-center"
					>
						<Ionicons name="chevron-back" size={15} className="text-gray600" />
					</Pressable>
					<Pressable
						onPress={() => onChangeMonth(1)}
						disabled={isCurrentMonth}
						hitSlop={10}
						accessibilityLabel="다음 달"
						accessibilityRole="button"
						accessibilityState={{ disabled: isCurrentMonth }}
						style={({ pressed }) => ({ opacity: isCurrentMonth ? 0.3 : pressed ? 0.5 : 1 })}
						className="bg-gray200 h-8 w-8 rounded-2xl items-center justify-center"
					>
						<Ionicons name="chevron-forward" size={15} className="text-gray600" />
					</Pressable>
				</View>
			</View>

			{/* 요일 헤더 */}
			<View className="flex-row mt-6 justify-around">
				{WEEKDAYS.map((label) => (
					<Text
						key={label}
						className="flex-1 text-center text-[11px] text-gray500 font-pretendard-regular"
					>
						{label}
					</Text>
				))}
			</View>

			{/* 날짜 그리드 — 날짜 숫자는 항상 표시, 기록이 있는 날은 그 아래에 길쭉한 우표 썸네일 */}
			{weeks.map((week, wi) => (
				<View key={wi} className="flex-row" style={{ height: rowHeight, marginTop: ROW_GAP }}>
					{week.map(({ day, inMonth }, di) => {
						const dateKey = inMonth ? isoDateKey(year, month, day) : `${wi}-${di}`;
						const isFuture = inMonth && dateKey > today;
						const isToday = inMonth && dateKey === today;
						const hasEntry = inMonth && markedDates.includes(dateKey);
						const dayImage = inMonth ? dayImages?.[dateKey] : undefined;
						const hasImage = Boolean(dayImage?.source);
						const hasColor = Boolean(dayImage?.color);

						return (
							<Pressable
								key={`${wi}-${di}`}
								onPress={() => hasEntry && onSelectDate(dateKey)}
								disabled={!hasEntry}
								accessibilityLabel={
									hasEntry
										? `${month}월 ${day}일 일기 보기`
										: `${month}월 ${day}일, 기록 없음`
								}
								accessibilityRole="button"
								accessibilityState={{ disabled: !hasEntry }}
								style={({ pressed }) => ({ opacity: pressed && hasEntry ? 0.6 : 1 })}
								className="flex-1 items-center px-[3px]"
							>
								<View
									className={cn(
										'w-6 h-6 rounded-lg items-center justify-center',
										isToday ? 'bg-gray900/10' : 'bg-transparent',
									)}
								>
									<Text
										className={cn(
											'font-pretendard-medium text-[13px]',
											!inMonth && 'text-gray300',
											inMonth && isFuture && 'text-gray400',
											inMonth && !isFuture && 'text-gray700',
										)}
									>
										{day}
									</Text>
								</View>

								{(hasImage || hasColor) && (
									<View className="w-full flex-1 mt-1">
										<DiaryStampCell
											source={dayImage?.source}
											color={dayImage?.color}
										/>
									</View>
								)}
							</Pressable>
						);
					})}
				</View>
			))}
		</View>
	);
}
