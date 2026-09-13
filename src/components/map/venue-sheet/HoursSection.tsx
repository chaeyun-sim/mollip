import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/src/lib/cn';
import { expandDayLabel, getTodayEntry, parseHoursEntries } from '@/src/utils/venueHours';
import { WEEKDAYS } from '@/src/constants/week';

interface HoursSectionProps {
	openHours: string;
	closedDays?: string;
	filterDate: Date;
}

export function HoursSection({ openHours, closedDays, filterDate }: HoursSectionProps) {
	const [expanded, setExpanded] = useState(false);

	const entries = useMemo(() => parseHoursEntries(openHours, closedDays), [openHours, closedDays]);
	const todayEntry = useMemo(() => getTodayEntry(entries, filterDate), [entries, filterDate]);

	const todayDayName = WEEKDAYS[filterDate.getDay()];
	const showChevron = entries.length > 1;
	const displayLabel = todayEntry ? `${todayDayName}  ${todayEntry.hours}` : openHours;

	return (
		<View>
			<Pressable
				className="flex-row items-center gap-1"
				onPress={() => showChevron && setExpanded((e) => !e)}
				accessibilityRole="button"
				accessibilityLabel={`운영시간 ${displayLabel}`}
			>
				<Ionicons name="time-outline" size={13} className="text-black/45 mt-px" />
				<Text className="text-black/60 text-[13px] font-pretendard-medium flex-1">
					{displayLabel}
				</Text>
				{showChevron && (
					<Ionicons
						name={expanded ? 'chevron-up' : 'chevron-down'}
						size={12}
						className="text-black/35"
					/>
				)}
			</Pressable>
			{expanded && (
				<View
					className="mt-2 rounded-xl overflow-hidden border border-black/6"
					style={{
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 1 },
						shadowOpacity: 0.06,
						shadowRadius: 4,
					}}
				>
					{entries.map((entry, i) => {
						const isToday =
							entry.days === '매일' || expandDayLabel(entry.days).includes(todayDayName);
						return (
							<View
								key={i}
								className={cn(
									'flex-row items-center px-3 py-2',
									isToday ? 'bg-[#EDEAE4]' : 'bg-[#F5F3EF]',
									i > 0 && 'border-t border-black/5',
								)}
							>
								<Text
									className={cn(
										'w-[84px] text-[12.5px] font-pretendard-medium',
										isToday ? 'text-black/70' : 'text-black/38',
									)}
								>
									{entry.days}
								</Text>
								<Text
									className={cn(
										'flex-1 text-[12.5px] font-pretendard-medium',
										entry.isClosed ? 'text-black/30' : isToday ? 'text-black/70' : 'text-black/50',
									)}
								>
									{entry.hours}
								</Text>
							</View>
						);
					})}
				</View>
			)}
		</View>
	);
}
