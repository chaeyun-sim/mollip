import { Ionicons } from '@expo/vector-icons';
import { Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import { SearchBar } from '@/src/components/common/SearchBar';
import { RoutePlanningBar } from '@/src/components/map/RoutePlanningBar';
import { cn } from '@/src/lib/cn';
import type { VenueGroup } from '@/src/data/venues';
import type { DirectionsStatus, RouteEndpoint } from '@/src/hooks/useDirections';
import type { RecentLocation } from '@/src/hooks/useRecentLocations';

interface MapTopBarProps {
	insetsTop: number;
	directionsStatus: DirectionsStatus;
	searchText: string;
	onChangeSearchText: (text: string) => void;
	mapVenues: VenueGroup[];
	onMarkerPress: (name: string, lat: number, lon: number) => void;
	routeOrigin: RouteEndpoint | null;
	destination: RouteEndpoint | null;
	dbVenues: VenueGroup[];
	hasCurrentLocation: boolean;
	recentLocations: RecentLocation[];
	onSelectOrigin: (loc: RouteEndpoint) => void;
	onSelectDestination: (loc: RouteEndpoint) => void;
	onUseCurrentLocation: () => void;
	onFocusLocation: (coord: { latitude: number; longitude: number }) => void;
	onAddRecent: (loc: RecentLocation) => void;
	onSwap: () => void;
	onConfirm: () => void;
	onClose: () => void;
}

export function MapTopBar({
	insetsTop,
	directionsStatus,
	searchText,
	onChangeSearchText,
	mapVenues,
	onMarkerPress,
	routeOrigin,
	destination,
	dbVenues,
	hasCurrentLocation,
	recentLocations,
	onSelectOrigin,
	onSelectDestination,
	onUseCurrentLocation,
	onFocusLocation,
	onAddRecent,
	onSwap,
	onConfirm,
	onClose,
}: MapTopBarProps) {
	return (
		<>
			<View className="absolute left-4 right-4" style={{ top: insetsTop + 12, zIndex: 20 }}>
				{directionsStatus === 'idle' ? (
					<>
						<SearchBar
							value={searchText}
							onChangeText={onChangeSearchText}
							placeholder="미술관 또는 전시 검색"
						/>
						{searchText.length > 0 && mapVenues.length > 0 && (
							<ScrollView
								className="rounded-2xl bg-white overflow-hidden mt-2"
								style={{
									maxHeight: 240,
									shadowColor: '#000',
									shadowOpacity: 0.1,
									shadowRadius: 8,
									shadowOffset: { width: 0, height: 2 },
									elevation: 4,
								}}
								keyboardShouldPersistTaps="handled"
								showsVerticalScrollIndicator={false}
							>
								{mapVenues.slice(0, 8).map((venue, index) => (
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
											index < Math.min(mapVenues.length, 8) - 1 && 'border-b border-black/[0.05]',
										)}
										accessibilityRole="button"
										accessibilityLabel={`${venue.venueName} 선택`}
									>
										<Ionicons name="location-outline" size={15} className="text-gray600" />
										<View className="ml-2.5 flex-1">
											<Text
												className="font-pretendard-medium text-[14px] text-gray900"
												numberOfLines={1}
											>
												{venue.venueName}
											</Text>
											{venue.venueAddress && (
												<Text
													className="font-pretendard-regular text-[12px] text-gray600 mt-0.5"
													numberOfLines={1}
												>
													{venue.venueAddress}
												</Text>
											)}
										</View>
									</Pressable>
								))}
							</ScrollView>
						)}
					</>
				) : directionsStatus === 'planning' ? (
					<RoutePlanningBar
						origin={routeOrigin}
						destination={destination}
						venues={dbVenues}
						hasCurrentLocation={hasCurrentLocation}
						recentLocations={recentLocations}
						onSelectOrigin={onSelectOrigin}
						onSelectDestination={onSelectDestination}
						onUseCurrentLocation={onUseCurrentLocation}
						onFocusLocation={onFocusLocation}
						onAddRecent={onAddRecent}
						onSwap={onSwap}
						onConfirm={onConfirm}
						onClose={onClose}
					/>
				) : (
					<Pressable
						onPress={onClose}
						className="self-start w-11 h-11 items-center justify-center rounded-full bg-white"
						style={{
							shadowColor: '#000',
							shadowOpacity: 0.1,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 2 },
							elevation: 4,
						}}
						hitSlop={6}
						accessibilityLabel="길찾기 닫기"
						accessibilityRole="button"
					>
						<Ionicons name="close" size={22} className="text-gray900" />
					</Pressable>
				)}
			</View>

			{/* 검색 결과 없음 */}
			{directionsStatus === 'idle' && searchText.length > 0 && mapVenues.length === 0 && (
				<View
					className="absolute left-4 right-4 items-center bg-white rounded-2xl px-4 py-3"
					style={{
						top: insetsTop + 56,
						zIndex: 20,
						shadowColor: '#000',
						shadowOpacity: 0.1,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 2 },
						elevation: 4,
					}}
				>
					<Text className="text-sm font-pretendard-medium text-black/40">
						"{searchText}"에 해당하는 미술관이 없어요
					</Text>
				</View>
			)}
		</>
	);
}
