import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { ExhibitionCard } from '@/src/components/map/ExhibitionCard';
import { VenueHeader } from '@/src/components/map/venue-sheet/VenueHeader';
import {
	VenueExhibitionTabs,
	type VenueExhibitionTab,
} from '@/src/components/map/venue-sheet/VenueExhibitionTabs';
import { parseDate } from '@/src/utils/mapUtils';
import type { VenueGroup } from '@/src/data/venues';
import { useAuthStore } from '@/src/store/authStore';
import { useVenueFollowStatus } from '@/src/hooks/useVenueFollowStatus';
import { VenueFollowButton } from './venue-sheet/VenueFollowButton';
import * as WebBrowser from 'expo-web-browser';

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

	// 부모 venue(예술의전당 등)면 첫 번째 하위 미술관, 아니면 venue 자체를 사용
	const activeVenue: VenueGroup = venue.subVenues?.[0] ?? venue;
	const userId = useAuthStore((state) => state.user?.id);
	const {
		isFollowed: isVenueFollowed,
		isLoading: isVenueFollowLoading,
		toggle: toggleVenueFollow,
	} = useVenueFollowStatus(userId, activeVenue.museumId);

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

	const listExhibitions = tab === 'active' ? activeExhibitions : upcomingExhibitions;

	return (
		<BottomSheetScrollView className="px-5 pt-3" showsVerticalScrollIndicator={false}>
			<View>
				<View className="flex-row items-center gap-3 mb-3">
					<Text
						className="flex-1 text-[26px] leading-[30px] font-hahmlet-bold text-gray900"
						numberOfLines={2}
					>
						{venue.venueName}
					</Text>
					<View className="flex-row items-start gap-2">
						<VenueFollowButton
							venueName={venue.venueName}
							isFollowed={isVenueFollowed}
							isLoading={isVenueFollowLoading}
							isSupported={activeVenue.museumId != null}
							onPress={toggleVenueFollow}
						/>
						<View className="items-center">
							<Pressable
								onPress={onRequestDirections}
								style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
								className="h-11 w-11 items-center justify-center rounded-full bg-primary-dark"
								accessibilityRole="button"
								accessibilityLabel={`${activeVenue.venueName}까지 길찾기`}
							>
								<Ionicons name="navigate-outline" size={20} className="text-white" />
							</Pressable>
							{distanceText && (
								<Text className="mt-1 text-[11px] font-pretendard-medium text-gray500">
									{distanceText}
								</Text>
							)}
						</View>
					</View>
				</View>

				<VenueHeader
					key={activeVenue.museumId ?? activeVenue.venueName}
					activeVenue={activeVenue}
					filterDate={filterDate}
				/>

				{activeVenue.homepageUrl && (
					<Pressable
						onPress={() => WebBrowser.openBrowserAsync(activeVenue.homepageUrl!)}
						style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
						className="flex-row items-center gap-2 mt-3"
						accessibilityLabel={`${activeVenue.venueName} 홈페이지로 이동`}
						accessibilityRole="link"
					>
						<Ionicons name="globe-outline" size={16} className="text-gray600" />
						<Text className="text-[13px] font-pretendard-semibold text-gray900">홈페이지</Text>
						<Ionicons name="arrow-up-outline" size={13} className="rotate-45 text-gray700 -ml-1" />
					</Pressable>
				)}

				{activeVenue.note && (
					<View className="flex-row items-center gap-2 mt-3">
						<Ionicons name="information-circle-outline" size={16} className=" text-error mt-0.5" />
						<Text className="flex-1 text-[13px] leading-[19px] font-pretendard-medium text-error">
							{activeVenue.note}
						</Text>
					</View>
				)}

				<View className="h-8" />

				<VenueExhibitionTabs
					tab={tab}
					onChangeTab={setTab}
					activeCount={activeExhibitions.length}
					upcomingCount={upcomingExhibitions.length}
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
