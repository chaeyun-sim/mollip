import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import { SearchBar } from '@/src/components/common/SearchBar';
import { cn } from '@/src/lib/cn';
import type { RecentLocation } from '@/src/hooks/useRecentLocations';
import type { RecentRoute } from '@/src/hooks/useRecentRoutes';
import type { VenueGroup } from '@/src/data/venues';

interface MapTopBarProps {
	insetsTop: number;
	searchText: string;
	onChangeSearchText: (text: string) => void;
	mapVenues: VenueGroup[];
	onMarkerPress: (name: string, lat: number, lon: number) => void;
	recentLocations: RecentLocation[];
	recentRoutes: RecentRoute[];
	onSelectRecentRoute: (route: RecentRoute) => void;
}

const dropdownShadow = {
	shadowColor: '#000',
	shadowOpacity: 0.1,
	shadowRadius: 8,
	shadowOffset: { width: 0, height: 2 },
	elevation: 4,
};

/** idle 상태의 검색바·검색 결과. 길찾기 바는 부모가 따로 마운트한다. */
export const MapTopBar = memo(function MapTopBar({
	insetsTop,
	searchText,
	onChangeSearchText,
	mapVenues,
	onMarkerPress,
	recentLocations,
	recentRoutes,
	onSelectRecentRoute,
}: MapTopBarProps) {
	const [isFocused, setIsFocused] = useState(false);
	const { t, i18n } = useTranslation();

	// 최근 방문 기록은 한국어 이름(마커 식별자)으로 저장되므로, 표시할 때만 영문 이름으로 바꾼다
	const venueNameEnByName = useMemo(
		() =>
			new Map(
				mapVenues.flatMap((venue) =>
					venue.venueNameEn ? [[venue.venueName, venue.venueNameEn] as const] : [],
				),
			),
		[mapVenues],
	);

	const isEn = i18n.language === 'en';
	const toDisplayVenueName = (name: string) => (isEn && venueNameEnByName.get(name)) || name;
	const showRecents =
		isFocused && searchText.length === 0 && (recentRoutes.length > 0 || recentLocations.length > 0);

	return (
		<>
			<View className="absolute left-4 right-4 z-[20]" style={{ top: insetsTop + 12 }}>
				<SearchBar
					value={searchText}
					onChangeText={onChangeSearchText}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					placeholder={t('map.venue_search_placeholder')}
				/>
				{searchText.length > 0 && mapVenues.length > 0 && (
					<ScrollView
						className="rounded-2xl bg-white overflow-hidden mt-2 max-h-60"
						style={dropdownShadow}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						{mapVenues.slice(0, 8).map((venue, index) => {
							// 마커 선택은 한국어 이름(식별자)으로, 표시만 영문 우선
							const displayName = ((isEn && venue.venueNameEn) || venue.venueName).trim();
							const displayAddress = (isEn && venue.venueAddressEn) || venue.venueAddress;
							return (
								<Pressable
									key={venue.venueName}
									onPress={() => {
										Keyboard.dismiss();
										onMarkerPress(
											venue.venueName,
											venue.coordinates.latitude,
											venue.coordinates.longitude,
										);
										onChangeSearchText('');
									}}
									className={cn(
										'flex-row items-center px-4 py-3',
										index < Math.min(mapVenues.length, 8) - 1 && 'border-b border-black/5',
									)}
									accessibilityRole="button"
									accessibilityLabel={t('map.select_place_a11y', { name: displayName })}
								>
									<Ionicons name="location-outline" size={15} className="text-gray600" />
									<View className="ml-2.5 flex-1">
										<Text
											className="font-pretendard-medium text-[14px] text-gray900"
											numberOfLines={1}
										>
											{displayName}
										</Text>
										{displayAddress && (
											<Text
												className="font-pretendard-regular text-[12px] text-gray600 mt-0.5"
												numberOfLines={1}
											>
												{displayAddress.trim()}
											</Text>
										)}
									</View>
								</Pressable>
							);
						})}
					</ScrollView>
				)}

				{/* 검색어 없이 focus만 됐을 때 — 최근 길찾기 + 최근 방문한 곳 */}
				{showRecents && (
					<ScrollView
						className="rounded-2xl bg-white overflow-hidden mt-2 max-h-72"
						style={dropdownShadow}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						{recentRoutes.length > 0 && (
							<>
								<Text className="px-4 pt-3 pb-1 text-[11px] font-pretendard-medium text-black/35">
									{t('map.recent_routes')}
								</Text>
								{recentRoutes.map((r, index) => (
									<Pressable
										key={`route-${r.origin.name}-${r.destination.name}`}
										onPress={() => {
											Keyboard.dismiss();
											onSelectRecentRoute(r);
										}}
										className={cn(
											'flex-row items-center px-4 py-3',
											index < recentRoutes.length - 1 && 'border-b border-black/5',
										)}
										accessibilityRole="button"
										accessibilityLabel={t('map.recent_route_a11y', {
											origin: r.origin.name,
											destination: r.destination.name,
										})}
									>
										<Ionicons name="navigate-outline" size={15} className="text-gray600" />
										<Text
											className="ml-2.5 flex-1 font-pretendard-medium text-[14px] text-gray900"
											numberOfLines={1}
										>
											{r.origin.name} → {r.destination.name}
										</Text>
									</Pressable>
								))}
							</>
						)}

						{recentLocations.length > 0 && (
							<>
								<Text className="px-4 pt-3 pb-1 text-[11px] font-pretendard-medium text-black/35">
									{t('map.recent_places')}
								</Text>
								{recentLocations.map((loc, index) => (
									<Pressable
										key={`loc-${loc.name}-${loc.coord.latitude}`}
										onPress={() => {
											Keyboard.dismiss();
											onMarkerPress(loc.name, loc.coord.latitude, loc.coord.longitude);
										}}
										className={cn(
											'flex-row items-center px-4 py-3',
											index < recentLocations.length - 1 && 'border-b border-black/5',
										)}
										accessibilityRole="button"
										accessibilityLabel={t('map.select_place_a11y', {
											name: toDisplayVenueName(loc.name),
										})}
									>
										<Ionicons name="time-outline" size={15} className="text-gray600" />
										<View className="ml-2.5 flex-1">
											<Text
												className="font-pretendard-medium text-[14px] text-gray900"
												numberOfLines={1}
											>
												{toDisplayVenueName(loc.name)}
											</Text>
											{loc.subtitle && (
												<Text
													className="font-pretendard-regular text-[12px] text-gray600 mt-0.5"
													numberOfLines={1}
												>
													{loc.subtitle}
												</Text>
											)}
										</View>
									</Pressable>
								))}
							</>
						)}
					</ScrollView>
				)}
			</View>

			{searchText.length > 0 && mapVenues.length === 0 && (
				<View
					className="absolute left-4 right-4 items-center bg-white rounded-2xl px-4 py-3"
					style={{
						top: insetsTop + 56,
						zIndex: 20,
						...dropdownShadow,
					}}
				>
					<Text className="text-sm font-pretendard-medium text-black/40">
						{t('map.no_venue_results', { query: searchText })}
					</Text>
				</View>
			)}
		</>
	);
});
