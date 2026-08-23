import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

import { ExhibitionCard } from '@/src/components/map/ExhibitionCard';
import { cn } from '@/src/lib/cn';
import { parseDate } from '@/src/utils/mapUtils';
import { openPhoneDialer } from '@/src/utils/venueContactActions';
import type { VenueGroup } from '@/src/data/venues';

// ── 운영시간 파싱 ─────────────────────────────────────────────────────────────

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;
type DayName = (typeof DAY_NAMES)[number];

interface HoursEntry {
	days: string;
	hours: string;
	isClosed: boolean;
}

function expandDayLabel(label: string): DayName[] {
	const rangeMatch = label.match(/^([월화수목금토일])~([월화수목금토일])$/);
	if (rangeMatch) {
		const start = DAY_NAMES.indexOf(rangeMatch[1] as DayName);
		const end = DAY_NAMES.indexOf(rangeMatch[2] as DayName);
		if (start !== -1 && end !== -1) return Array.from(DAY_NAMES).slice(start, end + 1) as DayName[];
	}
	return label.split(/[·,]/).map((d) => d.trim()) as DayName[];
}

function parseHoursEntries(openHours: string, closedDays?: string): HoursEntry[] {
	if (!openHours || openHours.includes('정보 없음')) return [];
	const entries: HoursEntry[] = openHours
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.map((line) => {
			const m = line.match(/^([월화수목금토일,·~]+)\s*:\s*(.+)$/);
			if (m) return { days: m[1].replace(/,/g, '·'), hours: m[2].trim(), isClosed: false };
			return { days: '매일', hours: line, isClosed: false };
		});
	if (closedDays) entries.push({ days: closedDays.replace(/,/g, '·'), hours: '휴무', isClosed: true });
	return entries;
}

function getTodayEntry(entries: HoursEntry[], date: Date): HoursEntry | null {
	const dayName = DAY_NAMES[date.getDay()];
	for (const entry of entries) {
		if (entry.days === '매일') return entry;
		if (expandDayLabel(entry.days).includes(dayName)) return entry;
	}
	return null;
}

// ── HoursSection ─────────────────────────────────────────────────────────────

interface HoursSectionProps {
	openHours: string;
	closedDays?: string;
	filterDate: Date;
}

function HoursSection({ openHours, closedDays, filterDate }: HoursSectionProps) {
	const [expanded, setExpanded] = useState(false);

	const entries = useMemo(() => parseHoursEntries(openHours, closedDays), [openHours, closedDays]);
	const todayEntry = useMemo(() => getTodayEntry(entries, filterDate), [entries, filterDate]);
	const todayDayName = DAY_NAMES[filterDate.getDay()];
	const showChevron = entries.length > 1;

	const displayLabel =
		entries.length === 0
			? openHours
			: todayEntry
				? `${todayDayName}  ${todayEntry.hours}`
				: openHours;

	return (
		<View>
			<Pressable
				className='flex-row items-center gap-1'
				onPress={() => showChevron && setExpanded((e) => !e)}
				accessibilityRole='button'
				accessibilityLabel={`운영시간 ${displayLabel}`}
			>
				<Ionicons name='time-outline' size={13} color='rgba(0,0,0,0.45)' style={{ marginTop: 1 }} />
				<Text className='text-black/60 text-[13px] font-pretendard-medium flex-1'>
					{displayLabel}
				</Text>
				{showChevron && (
					<Ionicons
						name={expanded ? 'chevron-up' : 'chevron-down'}
						size={12}
						color='rgba(0,0,0,0.35)'
					/>
				)}
			</Pressable>
			{expanded && (
				<View
					className='mt-2 rounded-xl overflow-hidden border border-black/[0.06]'
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
									i > 0 && 'border-t border-black/[0.05]',
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

interface VenueSheetProps {
	venue: VenueGroup;
	filterDate: Date;
	distanceText: string | null;
	onGoToExhibition: (id: string) => void;
	onRequestDirections: () => void;
}

type Tab = 'active' | 'upcoming';

export function VenueSheet({
	venue,
	filterDate,
	distanceText,
	onGoToExhibition,
	onRequestDirections,
}: VenueSheetProps) {
	const [tab, setTab] = useState<Tab>('active');
	const [subVenueIdx, setSubVenueIdx] = useState(0);

	// 부모 venue(예술의전당 등)면 선택된 하위 미술관, 아니면 venue 자체를 사용
	const isGrouped = Boolean(venue.subVenues?.length);
	const activeVenue: VenueGroup = isGrouped
		? venue.subVenues![subVenueIdx]
		: venue;

	const copyAddress = async (address: string) => {
		try {
			const Clipboard =
				require('expo-clipboard') as typeof import('expo-clipboard');
			await Clipboard.setStringAsync(address);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch {
			await Share.share({ message: address });
		}
	};

	const callVenue = async (phone: string) => {
		const ok = await openPhoneDialer(phone);
		if (!ok) {
			Alert.alert(
				'전화번호를 확인해 주세요',
				'기기에서 전화 앱을 사용할 수 없거나 번호 형식이 올바르지 않아요.',
			);
		}
	};

	const activeExhibitions = useMemo(() => {
		const d = new Date(filterDate);
		d.setHours(0, 0, 0, 0);
		return activeVenue.exhibitions.filter((ex) => {
			const start = parseDate(ex.startDate);
			const end = parseDate(ex.endDate);
			end.setHours(23, 59, 59, 999);
			return d >= start && d <= end;
		});
	}, [activeVenue, filterDate]);

	const upcomingExhibitions = useMemo(() => {
		const d = new Date(filterDate);
		d.setHours(0, 0, 0, 0);
		return activeVenue.exhibitions.filter((ex) => parseDate(ex.startDate) > d);
	}, [activeVenue, filterDate]);

	const heroExhibition = activeExhibitions[0] ?? upcomingExhibitions[0];
	const listExhibitions =
		tab === 'active' ? activeExhibitions : upcomingExhibitions;
	const accentColor = heroExhibition?.posterColor ?? '#1C1917';

	// 하위 미술관 변경 시 전시 탭을 '진행 중'으로 초기화
	const handleSubVenueChange = (idx: number) => {
		setSubVenueIdx(idx);
		setTab('active');
	};

	return (
		<BottomSheetScrollView
			className='px-5 pt-3'
			showsVerticalScrollIndicator={false}
		>
			{/* 헤더 영역 */}
			<View>
				<View className='flex-row items-start justify-between mb-2'>
					<View className='flex-1 pr-12'>
						<Text className='text-black text-[26px] font-hahmlet-bold leading-[30px]'>
							{venue.venueName}
						</Text>
						<View className='flex flex-col gap-2 mt-4'>
							{venue.venueAddress && (
								<Pressable
									onPress={() => copyAddress(venue.venueAddress!)}
									hitSlop={4}
									style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
									className='flex-row items-center gap-1 self-start max-w-full'
									accessibilityRole='button'
									accessibilityHint='탭하면 주소가 복사됩니다'
									accessibilityLabel={`주소 ${venue.venueAddress}`}
								>
									<Ionicons name='location-outline' size={13} color='rgba(0,0,0,0.45)' />
									<Text
										className='text-black/60 text-[13px] font-pretendard-medium shrink'
										numberOfLines={2}
										dataDetectorType='none'
									>
										{venue.venueAddress}
									</Text>
								</Pressable>
							)}

							<HoursSection
								openHours={activeVenue.openHours}
								closedDays={activeVenue.closedDays}
								filterDate={filterDate}
							/>
							{activeVenue.phone && (
								<Pressable
									onPress={() => callVenue(activeVenue.phone!)}
									hitSlop={4}
									style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
									className='flex-row items-center gap-1 self-start'
									accessibilityRole='button'
									accessibilityHint='탭하면 전화 앱으로 연결됩니다'
									accessibilityLabel={`전화번호 ${activeVenue.phone}`}
								>
									<Ionicons name='call-outline' size={13} color='rgba(0,0,0,0.45)' />
									<Text
										className='text-black/60 text-[13px] font-pretendard-medium'
										numberOfLines={1}
										dataDetectorType='none'
									>
										{activeVenue.phone}
									</Text>
								</Pressable>
							)}
							{activeVenue.parking && (
								<View className='flex-row items-start gap-1'>
									<Ionicons name='car-outline' size={13} color='rgba(0,0,0,0.45)' style={{ marginTop: 2 }} />
									<Text
										className='text-black/60 text-[13px] font-pretendard-medium flex-1'
										numberOfLines={2}
									>
										{activeVenue.parking}
									</Text>
								</View>
							)}
						</View>
					</View>

					<View className='items-center'>
						<Pressable
							onPress={onRequestDirections}
							hitSlop={6}
							style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
							className='items-center justify-center rounded-full bg-[#1C1917] w-11 h-11'
							accessibilityRole='button'
							accessibilityLabel={`${venue.venueName}까지 길찾기`}
						>
							<Ionicons name='navigate-outline' size={20} color='white' />
						</Pressable>
						{distanceText && (
							<Text className='text-black/45 text-[11px] font-pretendard-medium mt-1.5'>
								{distanceText}
							</Text>
						)}
					</View>
				</View>

				<View className='mt-2 mb-5'>
					{activeVenue.description && (
						<Text
							className='text-black/65 text-[13px] font-pretendard-regular leading-[19px]'
							numberOfLines={3}
						>
							{activeVenue.description}
						</Text>
					)}
					{activeVenue.homepageUrl && (
						<Pressable
							onPress={() => WebBrowser.openBrowserAsync(activeVenue.homepageUrl!)}
							hitSlop={8}
							className='flex-row items-center gap-1 mt-2'
							accessibilityLabel='홈페이지로 이동'
							accessibilityRole='link'
						>
							<Text className='text-black text-[13px] font-pretendard-semibold underline'>
								홈페이지
							</Text>
							<Ionicons
								name='arrow-up-outline'
								size={11}
								color='#1C1917'
								style={{ transform: [{ rotate: '45deg' }] }}
							/>
						</Pressable>
					)}
					{activeVenue.note && (
						<View className='mt-3 px-3.5 py-3 rounded-2xl bg-black/[0.04] flex-row gap-2.5'>
							<Ionicons
								name='information-circle-outline'
								size={15}
								color='rgba(0,0,0,0.45)'
								style={{ marginTop: 1 }}
							/>
							<Text className='flex-1 text-[13px] leading-[20px] text-black/55 font-pretendard-regular'>
								{activeVenue.note}
							</Text>
						</View>
					)}
				</View>

				{activeVenue.amenities && activeVenue.amenities.length > 0 && (
					<View className='flex-row flex-wrap gap-1.5 mb-5'>
						{activeVenue.amenities.map((amenity) => (
							<View key={amenity} className='rounded-full px-2.5 py-1 bg-black/[0.04]'>
								<Text className='text-black/55 text-[12px] font-pretendard-medium'>
									{amenity}
								</Text>
							</View>
						))}
					</View>
				)}

				{/* 하위 미술관 선택 — 예술의전당처럼 같은 주소에 여러 관이 있을 때 */}
				{isGrouped && (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className='mb-4 -mx-5'
						contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
					>
						{venue.subVenues!.map((sv, idx) => (
							<Pressable
								key={sv.venueName}
								onPress={() => handleSubVenueChange(idx)}
								hitSlop={4}
								style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
								className={cn(
									'px-3.5 py-2 rounded-full border',
									subVenueIdx === idx
										? 'bg-[#1C1917] border-[#1C1917]'
										: 'bg-transparent border-black/15',
								)}
								accessibilityRole='tab'
								accessibilityState={{ selected: subVenueIdx === idx }}
								accessibilityLabel={sv.venueName}
							>
								<Text
									className={cn(
										'text-[13px] font-pretendard-semibold',
										subVenueIdx === idx ? 'text-white' : 'text-black/60',
									)}
								>
									{sv.venueName.split(' ').slice(1)}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				)}

				{/* 탭 — 카탈로그 목차처럼, 채워진 필 대신 밑줄로 선택을 표시 */}
				<View
					className='flex-row items-end gap-6 mb-4 border-b border-black/[0.06]'
					accessibilityRole='tablist'
				>
					{(
						[
							['active', '진행 중', activeExhibitions.length],
							['upcoming', '예정', upcomingExhibitions.length],
						] as const
					).map(([key, label, count]) => (
						<Pressable
							key={key}
							onPress={() => setTab(key)}
							hitSlop={8}
							className='pt-2 pb-2.5'
							style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
							accessibilityRole='tab'
							accessibilityState={{ selected: tab === key }}
							accessibilityLabel={`${label} 전시 ${count}개`}
						>
							<Text
								className={cn(
									'text-[14px] font-pretendard-bold',
									tab === key ? 'text-black' : 'text-black/55',
								)}
							>
								{label}{' '}
								<Text className='text-[12px] font-pretendard-medium'>{count}</Text>
							</Text>
							{tab === key && (
								<View
									className='absolute -bottom-px left-0 right-0 h-[2px] rounded-full'
									style={{ backgroundColor: accentColor }}
								/>
							)}
						</Pressable>
					))}
				</View>
			</View>

			{/* 전시 목록 (선택된 탭) */}
			<View>
				{listExhibitions.length === 0 ? (
					<View className='flex-row items-center gap-2 py-2 mb-8'>
						<Ionicons name='warning-outline' size={16} color='rgba(0,0,0,0.3)' />
						<Text className='text-black/45 text-sm font-pretendard-regular'>
							{tab === 'active' ? '진행 중인 전시가 없어요' : '예정된 전시가 없어요'}
						</Text>
					</View>
				) : (
					<View className='gap-3 mb-10'>
						{listExhibitions.map((ex) => (
							<ExhibitionCard
								key={ex.id}
								ex={ex}
								status={tab}
								onPress={onGoToExhibition}
							/>
						))}
					</View>
				)}
			</View>
		</BottomSheetScrollView>
	);
}
