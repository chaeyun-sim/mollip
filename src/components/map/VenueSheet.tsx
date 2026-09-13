import { useMemo, useState } from 'react';
import { Pressable, Text, View, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { ExhibitionCard } from '@/src/components/map/ExhibitionCard';
import { VenueHeader } from '@/src/components/map/venue-sheet/VenueHeader';
import { VenueDetails } from '@/src/components/map/venue-sheet/VenueDetails';
import {
	VenueExhibitionTabs,
	type VenueExhibitionTab,
} from '@/src/components/map/venue-sheet/VenueExhibitionTabs';
import { parseDate } from '@/src/utils/mapUtils';
import type { VenueGroup } from '@/src/data/venues';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

interface VenueSheetProps {
	venue: VenueGroup;
	filterDate: Date;
	distanceText: string | null;
	onGoToExhibition: (id: string) => void;
	onRequestDirections: () => void;
}

export function VenueSheet({
	venue,
	filterDate,
	distanceText,
	onGoToExhibition,
	onRequestDirections,
}: VenueSheetProps) {
	const [tab, setTab] = useState<VenueExhibitionTab>('active');
	const [subVenueIdx, setSubVenueIdx] = useState(0);

	// 부모 venue(예술의전당 등)면 선택된 하위 미술관, 아니면 venue 자체를 사용
	const isGrouped = Boolean(venue.subVenues?.length);
	const activeVenue: VenueGroup = isGrouped ? venue.subVenues![subVenueIdx] : venue;

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
	const listExhibitions = tab === 'active' ? activeExhibitions : upcomingExhibitions;
	const accentColor = heroExhibition?.posterColor ?? colors.gray900;

	// 하위 미술관 변경 시 전시 탭을 '진행 중'으로 초기화
	const handleSubVenueChange = (idx: number) => {
		setSubVenueIdx(idx);
		setTab('active');
	};

	return (
		<BottomSheetScrollView className="px-5 pt-3" showsVerticalScrollIndicator={false}>
			<View>
				<VenueHeader
					venueName={venue.venueName}
					activeVenue={activeVenue}
					filterDate={filterDate}
					distanceText={distanceText}
					onRequestDirections={onRequestDirections}
				/>

				<VenueDetails activeVenue={activeVenue} />

				{/* 하위 미술관 선택 — 예술의전당처럼 같은 주소에 여러 관이 있을 때 */}
				{isGrouped && (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="mb-4 -mx-5"
						contentContainerClassName="px-5 gap-2"
					>
						{venue.subVenues?.map((sv, idx) => (
							<Pressable
								key={sv.venueName}
								onPress={() => handleSubVenueChange(idx)}
								hitSlop={4}
								style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
								className={cn(
									'px-3.5 py-2 rounded-full border',
									subVenueIdx === idx
										? 'bg-primary-dark border-primary-dark'
										: 'bg-transparent border-black/15',
								)}
								accessibilityRole="tab"
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

				<VenueExhibitionTabs
					tab={tab}
					onChangeTab={setTab}
					activeCount={activeExhibitions.length}
					upcomingCount={upcomingExhibitions.length}
					accentColor={accentColor}
				/>
			</View>

			{/* 전시 목록 (선택된 탭) */}
			<View>
				{listExhibitions.length === 0 ? (
					<View className="flex-row items-center gap-2 py-2 mb-8">
						<Ionicons name="warning-outline" size={16} color="rgba(0,0,0,0.3)" />
						<Text className="text-black/45 text-sm font-pretendard-regular">
							{tab === 'active' ? '진행 중인 전시가 없어요' : '예정된 전시가 없어요'}
						</Text>
					</View>
				) : (
					<View className="gap-3 mb-10">
						{listExhibitions.map((ex) => (
							<ExhibitionCard key={ex.id} ex={ex} status={tab} onPress={onGoToExhibition} />
						))}
					</View>
				)}
			</View>
		</BottomSheetScrollView>
	);
}
