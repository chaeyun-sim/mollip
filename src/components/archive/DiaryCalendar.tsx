import { cn } from '@/src/lib/cn';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';

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

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function toDateKey(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function rotationForDateKey(dateKey: string): number {
	const seed = dateKey
		.replace(/-/g, '')
		.split('')
		.reduce((a, c) => a + c.charCodeAt(0), 0);
	return (seed % 31) - 15;
}

export function DiaryCalendar({
	year,
	month,
	markedDates,
	dayImages,
	onSelectDate,
	onChangeMonth,
}: DiaryCalendarProps) {
	const todayKey = toDateKey(
		new Date().getFullYear(),
		new Date().getMonth() + 1,
		new Date().getDate(),
	);

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
		<View className="w-full rounded-[20px] py-4 px-3 bg-[#0F0D0C]">
			{/* 월 네비게이션 */}
			<View className="flex-row items-center justify-center gap-5 py-3">
				<Pressable
					onPress={() => onChangeMonth(-1)}
					hitSlop={10}
					accessibilityLabel="이전 달"
					accessibilityRole="button"
					style={({ pressed }) => ({
						opacity: pressed ? 0.5 : 1,
					})}
					className="bg-[#3D3733] h-8 w-8 rounded-2xl items-center justify-center"
				>
					<Ionicons name="chevron-back" size={15} className="text-muted" />
				</Pressable>
				<Text className="font-pretendard-semibold text-[17px] text-white">
					{year}년 {month}월
				</Text>
				<Pressable
					onPress={() => onChangeMonth(1)}
					hitSlop={10}
					accessibilityLabel="다음 달"
					accessibilityRole="button"
					style={({ pressed }) => ({
						opacity: pressed ? 0.5 : 1,
					})}
					className="bg-[#3D3733] h-8 w-8 rounded-2xl items-center justify-center"
				>
					<Ionicons name="chevron-forward" size={15} className="text-muted" />
				</Pressable>
			</View>

			{/* 요일 헤더 */}
			<View className="flex-row mt-4 justify-around">
				{WEEK_LABELS.map((label) => (
					<Text
						key={label}
						className="text-center text-[11px] text-white/40 font-pretendard-regular"
					>
						{label}
					</Text>
				))}
			</View>

			{/* 날짜 그리드 */}
			{weeks.map((week, wi) => (
				<View key={wi} className="flex-row mt-1 overflow-hidden h-[52px]">
					{week.map((day, di) => {
						if (day === null) {
							return <View key={`${wi}-${di}`} style={{ flex: 1 }} />;
						}
						const dateKey = toDateKey(year, month, day);
						const isFuture = dateKey > todayKey;
						const isToday = dateKey === todayKey;
						const hasEntry = markedDates.includes(dateKey);
						const dayImage = dayImages?.[dateKey];
						const hasImage = Boolean(dayImage?.source);
						const hasColor = Boolean(dayImage?.color);
						const rotation = rotationForDateKey(dateKey);

						return (
							<Pressable
								key={dateKey}
								onPress={() => hasEntry && onSelectDate(dateKey)}
								disabled={!hasEntry}
								accessibilityLabel={
									hasEntry ? `${month}월 ${day}일 일기 보기` : `${month}월 ${day}일, 기록 없음`
								}
								accessibilityRole="button"
								accessibilityState={{ disabled: !hasEntry }}
								style={({ pressed }) => ({
									opacity: pressed ? 0.5 : 1,
								})}
								className="flex-1 items-center justify-center"
							>
								{/* 날짜 숫자 — 항상 표시 */}
								<View
									className={cn(
										'w-7 h-7 rounded-xl items-center justify-center',
										isToday && !hasImage && !hasColor ? 'bg-white/15' : 'bg-transparent',
									)}
								>
									<Text
										className={cn(
											'font-pretendard-medium text-[13px]',
											isFuture ? 'text-white/20' : 'text-white/60',
										)}
									>
										{day}
									</Text>
								</View>

								{/* 이미지/컬러 — 날짜 위에 absolute 오버레이 */}
								{(hasImage || hasColor) && (
									<View className="absolute w-[40px] h-[40px] rounded-3xl bg-[#6c6560] items-center justify-center">
										<View
											className="w-10 h-10 rounded-lg overflow-hidden"
											style={{ transform: [{ rotate: `${rotation}deg` }] }}
										>
											{hasImage ? (
												<Image
													source={dayImage!.source!}
													resizeMode="cover"
													style={{ width: 40, height: 40 }}
												/>
											) : (
												<View
													className="w-10 h-10 "
													style={{
														backgroundColor: dayImage!.color,
													}}
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
