import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { HoursSection } from '@/src/components/map/venue-sheet/HoursSection';
import type { VenueGroup } from '@/src/data/venues';
import { copyVenueAddress, openPhoneDialer } from '@/src/utils/venueContactActions';

interface VenueHeaderProps {
	activeVenue: VenueGroup;
	filterDate: Date;
}

export function VenueHeader({ activeVenue, filterDate }: VenueHeaderProps) {
	const [showWeeklyHours, setShowWeeklyHours] = useState(false);
	const address = activeVenue.venueAddress;

	const handleCallVenue = async () => {
		const ok = await openPhoneDialer(activeVenue.phone!);
		if (!ok) {
			Alert.alert(
				'전화번호를 확인해 주세요',
				'기기에서 전화 앱을 사용할 수 없거나 번호 형식이 올바르지 않아요.',
			);
		}
	};

	return (
		<View className="gap-2">
			<View className="gap-1.5">
				<Pressable
					onPress={() => setShowWeeklyHours((prev) => !prev)}
					className="flex-row items-center gap-1"
					accessibilityRole="button"
					accessibilityLabel="요일별 운영시간 보기"
					accessibilityState={{ expanded: showWeeklyHours }}
				>
					<View className="flex-1">
						<HoursSection
							openHours={activeVenue.openHours}
							closedDays={activeVenue.closedDays}
							filterDate={filterDate}
						/>
					</View>
					<Ionicons
						name={showWeeklyHours ? 'chevron-up' : 'chevron-down'}
						size={12}
						className="text-gray400"
					/>
				</Pressable>
				{showWeeklyHours && (
					<HoursSection
						mode="weekly"
						openHours={activeVenue.openHours}
						closedDays={activeVenue.closedDays}
						filterDate={filterDate}
					/>
				)}
				{address && (
					<Pressable
						onPress={() => copyVenueAddress(address)}
						style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
						className="flex-row items-start gap-1.5"
						accessibilityRole="button"
						accessibilityHint="탭하면 주소가 복사됩니다"
						accessibilityLabel={`주소 ${address}`}
					>
						<Ionicons name="location-outline" size={14} className="mt-0.5 text-gray500" />
						<Text
							className="flex-1 text-[13px] leading-[18px] font-pretendard-medium text-gray700"
							numberOfLines={2}
							dataDetectorType="none"
						>
							{address}
						</Text>
					</Pressable>
				)}
			</View>

			{activeVenue.phone && (
				<Pressable
					onPress={handleCallVenue}
					style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
					className="flex-row items-center gap-2"
					accessibilityRole="button"
					accessibilityLabel={`전화번호 ${activeVenue.phone}`}
					accessibilityHint="탭하면 전화 앱으로 연결됩니다"
				>
					<Ionicons name="call-outline" size={14} className="mt-0.5 text-gray500" />
					<Text
						className="flex-1 text-[13px] leading-[18px] font-pretendard-medium text-gray700"
						numberOfLines={2}
						dataDetectorType="none"
					>
						{activeVenue.phone}
					</Text>
				</Pressable>
			)}

			{activeVenue.amenities && activeVenue.amenities.length > 0 && (
				<View className="flex-row items-start gap-2">
					<Ionicons name="heart-half-outline" size={16} className="mt-0.5 text-gray600" />
					<Text className="flex-1 text-[13px] leading-[19px] font-pretendard-medium text-gray700">
						{activeVenue.amenities.join(', ')}
					</Text>
				</View>
			)}

			{activeVenue.parking && (
				<View className="flex-row items-start gap-2">
					<Ionicons name="car-outline" size={16} className="mt-0.5 text-gray600" />
					<Text className="flex-1 text-[13px] leading-[19px] font-pretendard-medium text-gray700">
						{activeVenue.parking}
					</Text>
				</View>
			)}
		</View>
	);
}
