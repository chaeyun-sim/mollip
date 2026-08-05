import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
	Image,
	Pressable,
	Text,
	View,
	type ImageSourcePropType,
} from 'react-native';

import { cn } from '@/src/lib/cn';

// 기록이 있는 날 셀에 표시할 이미지 (포스터 또는 본 그림)
export interface DayImage {
	source?: ImageSourcePropType;
	color?: string;
}

interface DiaryCalendarProps {
	year: number;
	month: number; // 1~12
	markedDates: string[]; // 관람 기록·일기가 있는 날짜 키 (YYYY-MM-DD) — 이 날만 선택 가능
	dayImages?: Record<string, DayImage>;
	onSelectDate: (dateKey: string) => void;
	onChangeMonth: (offset: -1 | 1) => void;
}

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const INK = '#1C1917';

function toDateKey(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 관람 다이어리 달력. 날짜를 누르면 해당 일기로 이동한다.
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
					className='h-8 w-8 items-center justify-center rounded-full bg-white'
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
				>
					<Ionicons name='chevron-back' size={15} color='#78716C' />
				</Pressable>
				<Text className='text-[17px] font-pretendard-bold text-gray-900'>
					{year}년 {month}월
				</Text>
				<Pressable
					onPress={() => onChangeMonth(1)}
					hitSlop={10}
					accessibilityLabel='다음 달'
					accessibilityRole='button'
					className='h-8 w-8 items-center justify-center rounded-full bg-white'
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
				>
					<Ionicons name='chevron-forward' size={15} color='#78716C' />
				</Pressable>
			</View>

			{/* 요일 헤더 */}
			<View className='mt-5 flex-row'>
				{WEEK_LABELS.map((label) => (
					<Text
						key={label}
						className='flex-1 text-center text-[11px] font-pretendard-medium text-gray-400'
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
						const dayImage = dayImages?.[dateKey];
						const hasImage = Boolean(dayImage?.source || dayImage?.color);
						return (
							<Pressable
								key={dateKey}
								className='flex-1 items-center py-1.5'
								onPress={() => onSelectDate(dateKey)}
								disabled={!hasEntry}
								accessibilityLabel={
									hasEntry
										? `${month}월 ${day}일 일기 보기`
										: `${month}월 ${day}일, 기록 없음`
								}
								accessibilityRole='button'
								accessibilityState={{ disabled: !hasEntry }}
								style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
							>
								{/* 3:4 셀 — 기록이 있는 날은 포스터/그림, 없는 날은 숫자만 */}
								<View
									className={cn(
										'items-center justify-center overflow-hidden w-[36px] h-[48px]',
										hasImage ? 'rounded-lg' : 'rounded-full',
										isToday && !hasImage && 'bg-[#1C1917]',
									)}
									style={{
										...(hasImage
											? { backgroundColor: dayImage?.color ?? '#D6D3D1' }
											: null),
										...(isToday && hasImage
											? { borderWidth: 2, borderColor: INK }
											: null),
									}}
								>
									{dayImage?.source && (
										<Image
											source={dayImage.source}
											resizeMode='cover'
											className='absolute h-full w-full'
										/>
									)}
									{hasImage && (
										// 숫자 가독성용 스크림
										<View className='absolute h-full w-full bg-black/28' />
									)}
									<Text
										className={cn('text-[13px]', {
											'text-white font-pretendard-bold': hasImage,
											'text-white font-pretendard-medium': !hasImage && isToday,
											'text-gray-300 font-pretendard-medium':
												!hasImage && !isToday && isFuture,
											'text-gray-400 font-pretendard-medium':
												!hasImage && !isToday && !isFuture && !hasEntry,
											'text-gray-700 font-pretendard-semibold':
												!hasImage && !isToday && !isFuture && hasEntry,
										})}
									>
										{day}
									</Text>
								</View>
							</Pressable>
						);
					})}
				</View>
			))}
		</View>
	);
}
