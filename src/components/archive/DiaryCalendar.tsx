import { cn } from '@/src/lib/cn';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { WEEKDAYS } from '@/src/constants/week';
import type { DayEvent } from '@/src/utils/diaryEvents';

/** 캘린더 셀 날짜 키 — visitStore의 dateKey(YYYY-MM-DD, todayKey())와 동일 포맷으로 맞춘다 */
function isoDateKey(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 달마다 주(행) 수가 4~6개로 다르다(예: 2026년 5월은 6주) — 행 높이를 고정하면 6주짜리 달만 화면을
// 넘긴다. 그래서 "그리드 전체 높이"를 고정하고 행 높이를 주 수에 맞춰 나눈다 — 6주 달이 기준(가장
// 촘촘)이고, 주가 적은 달은 남는 공간만큼 우표가 더 커진다.
const GRID_TOTAL_HEIGHT = 450;
const ROW_GAP = 6;
/** 한 칸에 보여줄 개막·마감 칩 최대 개수 — 넘치면 +N */
const MAX_CHIPS = 2;

export interface DayImage {
	source?: ImageSourcePropType;
	color?: string;
}

interface DiaryCalendarProps {
	year: number;
	month: number;
	markedDates: string[];
	dayImages?: Record<string, DayImage>;
	/** 스크랩한 전시의 개막·마감 칩 (dateKey → 이벤트) */
	dayEvents?: Record<string, DayEvent[]>;
	onSelectDate: (dateKey: string) => void;
	onChangeMonth: (offset: -1 | 1) => void;
}

export function DiaryCalendar({
	year,
	month,
	markedDates,
	dayImages,
	dayEvents,
	onSelectDate,
	onChangeMonth,
}: DiaryCalendarProps) {
	const now = new Date();
	const today = now.toISOString().slice(0, 10);

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
		<View className="w-full px-1 pb-4">
			<View className="flex-row items-start justify-between">
				<View className="flex-row items-end gap-2">
					<Text className="font-hahmlet-bold text-gray900 tracking-[-1px] text-[56px] leading-tight">
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
					{/* 스크랩한 전시의 개막일은 미래일 수 있어 다음 달로도 넘길 수 있다 */}
					<Pressable
						onPress={() => onChangeMonth(1)}
						hitSlop={10}
						accessibilityLabel="다음 달"
						accessibilityRole="button"
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
						className="bg-gray200 h-8 w-8 rounded-2xl items-center justify-center"
					>
						<Ionicons name="chevron-forward" size={15} className="text-gray600" />
					</Pressable>
				</View>
			</View>

			{/* 범례 — 칩 색과 도장의 의미 */}
			<View className="flex-row items-center gap-3 mt-4">
				<View className="flex-row items-center gap-1">
					<View className="w-2 h-2 rounded-[2px] bg-brand" />
					<Text className="text-[11px] text-gray600 font-pretendard-medium">개막</Text>
				</View>
				<View className="flex-row items-center gap-1">
					<View className="w-2 h-2 rounded-[2px] bg-error" />
					<Text className="text-[11px] text-gray600 font-pretendard-medium">마감</Text>
				</View>
				<View className="flex-row items-center gap-1">
					<View className="w-2 h-2 rounded-[1px] border border-dashed border-gray500" />
					<Text className="text-[11px] text-gray600 font-pretendard-medium">관람</Text>
				</View>
			</View>

			{/* 요일 헤더 */}
			<View className="flex-row mt-4 justify-around">
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
						const events = (inMonth && dayEvents?.[dateKey]) || [];
						const isSelectable = hasEntry || events.length > 0;
						const hiddenEventCount = Math.max(0, events.length - MAX_CHIPS);
						const eventSummary = events
							.map((e) => `${e.title} ${e.kind === 'open' ? '개막' : '마감'}`)
							.join(', ');

						return (
							<Pressable
								key={`${wi}-${di}`}
								onPress={() => isSelectable && onSelectDate(dateKey)}
								disabled={!isSelectable}
								accessibilityLabel={[
									`${month}월 ${day}일`,
									hasEntry ? '일기 보기' : '기록 없음',
									eventSummary,
								]
									.filter(Boolean)
									.join(', ')}
								accessibilityRole="button"
								accessibilityState={{ disabled: !isSelectable }}
								style={({ pressed }) => ({ opacity: pressed && isSelectable ? 0.6 : 1 })}
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

								{/* 스크랩한 전시 칩 — 개막(보라) · 마감(빨강), 넘치면 +N */}
								{events.length > 0 && (
									<View className="w-full mt-0.5 gap-[2px]">
										{events.slice(0, MAX_CHIPS).map((event) => (
											<View
												key={`${event.id}-${event.kind}`}
												className={cn('rounded-[3px] px-[3px] py-px', {
													'bg-brand/15': event.kind === 'open',
													'bg-error/10': event.kind === 'close',
												})}
											>
												<Text
													numberOfLines={1}
													className={cn('text-[9px] leading-[12px] font-pretendard-semibold', {
														'text-brand': event.kind === 'open',
														'text-error': event.kind === 'close',
													})}
												>
													{event.title}
												</Text>
											</View>
										))}
										{hiddenEventCount > 0 && (
											<Text className="text-center text-[9px] leading-[11px] text-gray500 font-pretendard-medium">
												+{hiddenEventCount}
											</Text>
										)}
									</View>
								)}

								{(hasImage || hasColor) && (
									<View className="w-full flex-1 mt-1">
										<View
											className="w-full h-full rounded-[2px] bg-white border border-dashed border-gray300 p-[3px]"
											style={{
												shadowColor: '#2D2D23',
												shadowOpacity: 0.18,
												shadowRadius: 3,
												shadowOffset: { width: 0, height: 2 },
											}}
										>
											{dayImage?.source ? (
												<Image
													source={dayImage.source}
													resizeMode="cover"
													className="flex-1 rounded-[1px]"
												/>
											) : (
												<View
													className="flex-1 rounded-[1px]"
													style={{ backgroundColor: dayImage?.color }}
												/>
											)}
										</View>
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
