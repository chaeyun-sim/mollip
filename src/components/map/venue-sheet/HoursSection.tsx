import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/src/lib/cn';
import { buildWeeklyHours, getOpenStatus } from '@/src/utils/venueOpenStatus';

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
	const { t } = useTranslation();

	const todayIndex = filterDate.getDay();
	const weeklyHours = useMemo(
		() => buildWeeklyHours(openHours, closedDays),
		[closedDays, openHours],
	);
	const openStatus = useMemo(
		() => getOpenStatus(openHours, closedDays, filterDate),
		[closedDays, filterDate, openHours],
	);

	if (mode === 'weekly') {
		return (
			<View className="gap-1.5">
				<View className="overflow-hidden rounded-xl border border-gray300">
					{weeklyHours.map((entry, index) => {
						const isToday = entry.dayIndex === todayIndex;
						const hoursLabel = entry.isClosed
							? t('map.venue.weekly_closed')
							: (entry.hours ?? t('map.venue.weekly_no_info'));
						return (
							<View
								key={entry.dayIndex}
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
									{t(`map.venue.weekday_${entry.dayIndex}`)}
								</Text>
								<Text
									className={cn('flex-1 text-[12.5px] font-pretendard-medium', {
										'text-error': entry.isClosed,
										'text-gray900': !entry.isClosed && isToday,
										'text-gray600': !entry.isClosed && !isToday,
									})}
								>
									{hoursLabel}
								</Text>
							</View>
						);
					})}
				</View>
			</View>
		);
	}

	const isStatusKind =
		openStatus.kind === 'open' ||
		openStatus.kind === 'closed' ||
		openStatus.kind === 'closed-today';
	const statusLabel = {
		open: t('map.venue.status_open'),
		closed: t('map.venue.status_closed'),
		'closed-today': t('map.venue.status_closed_today'),
		'no-info': t('map.venue.hours_no_info'),
		raw: openStatus.kind === 'raw' ? openStatus.text : '',
	}[openStatus.kind];
	const hoursDetail = 'hours' in openStatus ? openStatus.hours : null;
	const displayLabel = hoursDetail ? `${statusLabel} · ${hoursDetail}` : statusLabel;

	return (
		<View
			className="flex-row items-center gap-1.5"
			accessible
			accessibilityLabel={t('map.venue.hours_a11y', { label: displayLabel })}
		>
			<Ionicons name="time-outline" size={14} className="text-gray500" />
			<Text className="text-[13px] leading-[18px] font-pretendard-medium text-gray700">
				{isStatusKind ? (
					<>
						<Text
							className={cn(
								'font-pretendard-medium',
								openStatus.kind === 'open' ? 'text-[#16A34A]' : 'text-[#DC2626]',
							)}
						>
							{statusLabel}
						</Text>
						{hoursDetail && ` · ${hoursDetail}`}
					</>
				) : (
					statusLabel
				)}
			</Text>
		</View>
	);
}
