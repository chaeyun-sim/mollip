import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Keyboard, Pressable, ScrollView, Text, View } from 'react-native';

import { SearchBar } from '@/src/components/common/SearchBar';
import { cn } from '@/src/lib/cn';
import type { VenueGroup } from '@/src/data/venues';

interface MapTopBarProps {
	insetsTop: number;
	searchText: string;
	onChangeSearchText: (text: string) => void;
	mapVenues: VenueGroup[];
	onMarkerPress: (name: string, lat: number, lon: number) => void;
}

/** idle 상태의 검색바·검색 결과. 길찾기 바는 부모가 따로 마운트한다. */
export const MapTopBar = memo(function MapTopBar({
	insetsTop,
	searchText,
	onChangeSearchText,
	mapVenues,
	onMarkerPress,
}: MapTopBarProps) {
	return (
		<>
			<View className="absolute left-4 right-4 z-[20]" style={{ top: insetsTop + 12 }}>
				<SearchBar
					value={searchText}
					onChangeText={onChangeSearchText}
					placeholder="미술관 또는 전시 검색"
				/>
				{searchText.length > 0 && mapVenues.length > 0 && (
					<ScrollView
						className="rounded-2xl bg-white overflow-hidden mt-2 max-h-60"
						style={{
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
									index < Math.min(mapVenues.length, 8) - 1 && 'border-b border-black/5',
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
										{venue.venueName.trim()}
									</Text>
									{venue.venueAddress && (
										<Text
											className="font-pretendard-regular text-[12px] text-gray600 mt-0.5"
											numberOfLines={1}
										>
											{venue.venueAddress.trim()}
										</Text>
									)}
								</View>
							</Pressable>
						))}
					</ScrollView>
				)}
			</View>

			{searchText.length > 0 && mapVenues.length === 0 && (
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
						&quot;{searchText}&quot;에 해당하는 미술관이 없어요
					</Text>
				</View>
			)}
		</>
	);
});
