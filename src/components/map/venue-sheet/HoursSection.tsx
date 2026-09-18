import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/src/lib/cn';
import { WEEKDAYS } from '@/src/constants/week';

interface HoursSectionProps {
	openHours: string;
	closedDays?: string;
	filterDate: Date;
	mode?: 'summary' | 'weekly';
}

export function HoursSection({
	openHours,
	closedDays,
	filterDate,
	mode = 'summary',
}: HoursSectionProps) {
	const todayDayName = WEEKDAYS[filterDate.getDay()];
	const weeklyHours = useMemo(
		() => buildWeeklyHours(openHours, closedDays),
		[closedDays, openHours],
	);
	const displayLabel = useMemo(
		() => formatOpenStatus(openHours, closedDays, filterDate),
		[closedDays, filterDate, openHours],
	);
	const summaryParts = useMemo(() => parseSummaryLabel(displayLabel), [displayLabel]);

	if (mode === 'weekly') {
		return (
			<View className="gap-1.5">
				<Text className="text-[12px] font-pretendard-semibold text-gray700">주간 운영시간</Text>
				<View className="overflow-hidden rounded-xl border border-gray300">
					{weeklyHours.map((entry, index) => {
						const isToday = entry.day === todayDayName;
						return (
							<View
								key={entry.day}
								className={cn(
									'flex-row items-center px-3 py-2',
									isToday ? 'bg-[#EDEAE4]' : 'bg-gray100',
									index > 0 && 'border-t border-gray300',
								)}
							>
								<Text
									className={cn(
										'w-10 text-[12.5px] font-pretendard-semibold',
										isToday ? 'text-gray900' : 'text-gray500',
									)}
								>
									{entry.day}
								</Text>
								<Text
									className={cn(
										'flex-1 text-[12.5px] font-pretendard-medium',
										entry.hours === '휴관'
											? 'text-gray400'
											: isToday
												? 'text-gray900'
												: 'text-gray600',
									)}
								>
									{entry.hours}
								</Text>
							</View>
						);
					})}
				</View>
			</View>
		);
	}

	return (
		<View
			className="flex-row items-center gap-1.5"
			accessible
			accessibilityLabel={`운영시간 ${displayLabel}`}
		>
			<Ionicons name="time-outline" size={14} className="text-gray500" />
			<Text className="flex-1 text-[13px] leading-[18px] font-pretendard-medium text-gray700">
				{summaryParts.status ? (
					<>
						<Text
							className={cn(
								'font-pretendard-medium',
								summaryParts.status === '휴관' ? 'text-[#DC2626]' : 'text-[#16A34A]',
							)}
						>
							{summaryParts.status}
						</Text>
						{summaryParts.detail ? ` · ${summaryParts.detail}` : null}
					</>
				) : (
					displayLabel
				)}
			</Text>
		</View>
	);
}

function includesDay(label: string | undefined, dayName: string): boolean {
	const normalized = label?.replace(/\s/g, '').replace(/요일/g, '') ?? '';
	if (!normalized || normalized === '없음' || normalized === '-') return false;
	if (normalized.includes('매일') || normalized.includes('연중무휴')) return true;
	if (normalized.includes('평일')) return ['월', '화', '수', '목', '금'].includes(dayName);
	if (normalized.includes('주말')) return ['토', '일'].includes(dayName);
	return normalized
		.split(/[,\s·/]+/)
		.map((item) => item.trim())
		.some((item) => item.includes(dayName));
}

function findHoursForDay(openHours: string, dayName: string): string | null {
	const lines = openHours
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	for (const line of lines) {
		const match = line.match(/(\d{1,2}:\d{2})\s*[~–-]\s*(\d{1,2}:\d{2})/);
		if (!match) continue;
		const label = line.slice(0, match.index).replace(/[:：]/g, '').trim();
		if (!label || includesDay(label, dayName)) return `${match[1]}-${match[2]}`;
	}

	const fallback = openHours.match(/(\d{1,2}:\d{2})\s*[~–-]\s*(\d{1,2}:\d{2})/);
	return fallback ? `${fallback[1]}-${fallback[2]}` : null;
}

function formatOpenStatus(openHours: string, closedDays: string | undefined, date: Date): string {
	const dayName = WEEKDAYS[date.getDay()];
	if (includesDay(closedDays, dayName)) return '오늘 휴관';
	if (!openHours || openHours.includes('정보 없음')) return '운영시간 정보 없음';
	const hours = findHoursForDay(openHours, dayName);
	return hours ? `운영중 · ${hours.replace('-', '–')}` : openHours;
}

function parseSummaryLabel(label: string): {
	status: '운영 중' | '휴관' | null;
	detail: string | null;
} {
	if (label === '오늘 휴관') return { status: '휴관', detail: null };
	const openMatch = label.match(/^운영중\s*[·•]\s*(.+)$/);
	if (openMatch) return { status: '운영 중', detail: openMatch[1] };
	return { status: null, detail: null };
}

function buildWeeklyHours(
	openHours: string,
	closedDays: string | undefined,
): { day: string; hours: string }[] {
	return ['월', '화', '수', '목', '금', '토', '일'].map((day) => {
		if (includesDay(closedDays, day)) return { day, hours: '휴관' };
		return { day, hours: findHoursForDay(openHours, day) ?? '정보 없음' };
	});
}
