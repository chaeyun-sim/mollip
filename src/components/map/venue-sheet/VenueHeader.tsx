import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';

import { HoursSection } from '@/src/components/map/venue-sheet/HoursSection';
import { copyVenueAddress, openPhoneDialer } from '@/src/utils/venueContactActions';
import type { VenueGroup } from '@/src/data/venues';

interface VenueHeaderProps {
	venueName: string;
	activeVenue: VenueGroup;
	filterDate: Date;
	distanceText: string | null;
	onRequestDirections: () => void;
}

export function VenueHeader({
	venueName,
	activeVenue,
	filterDate,
	distanceText,
	onRequestDirections,
}: VenueHeaderProps) {
	const address = activeVenue.venueAddress;
	const phone = activeVenue.phone;
	const parking = activeVenue.parking;

	const handleCallVenue = async (phoneNumber: string) => {
		const ok = await openPhoneDialer(phoneNumber);
		if (!ok) {
			Alert.alert(
				'전화번호를 확인해 주세요',
				'기기에서 전화 앱을 사용할 수 없거나 번호 형식이 올바르지 않아요.',
			);
		}
	};

	return (
		<View className="flex-row items-start justify-between mb-2">
			<View className="flex-1 pr-12">
				<Text className="text-black text-[26px] font-hahmlet-bold leading-[30px]">{venueName}</Text>
				<View className="gap-2 mt-4">
					{address && (
						<Pressable
							onPress={() => copyVenueAddress(address)}
							hitSlop={4}
							style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
							className="flex-row items-center gap-1 self-start max-w-full"
							accessibilityRole="button"
							accessibilityHint="탭하면 주소가 복사됩니다"
							accessibilityLabel={`주소 ${address}`}
						>
							<Ionicons name="location-outline" size={13} className="text-black/45" />
							<Text
								className="text-black/60 text-[13px] font-pretendard-medium shrink"
								numberOfLines={2}
								dataDetectorType="none"
							>
								{address}
							</Text>
						</Pressable>
					)}

					<HoursSection
						openHours={activeVenue.openHours}
						closedDays={activeVenue.closedDays}
						filterDate={filterDate}
					/>
					{phone && (
						<Pressable
							onPress={() => handleCallVenue(phone)}
							hitSlop={4}
							style={({ pressed }) => (pressed ? { opacity: 0.55 } : undefined)}
							className="flex-row items-center gap-1 self-start"
							accessibilityRole="button"
							accessibilityHint="탭하면 전화 앱으로 연결됩니다"
							accessibilityLabel={`전화번호 ${phone}`}
						>
							<Ionicons name="call-outline" size={13} className="text-black/45" />
							<Text
								className="text-black/60 text-[13px] font-pretendard-medium shrink"
								numberOfLines={1}
								dataDetectorType="none"
							>
								{phone}
							</Text>
						</Pressable>
					)}
					{parking && (
						<View className="flex-row items-start gap-1">
							<Ionicons name="car-outline" size={13} className="text-black/45 mt-0.5" />
							<Text
								className="text-black/60 text-[13px] font-pretendard-medium flex-1"
								numberOfLines={2}
							>
								{parking}
							</Text>
						</View>
					)}
				</View>
			</View>

			<View className="items-center">
				<Pressable
					onPress={onRequestDirections}
					hitSlop={6}
					style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
					className="items-center justify-center rounded-full bg-primary w-11 h-11"
					accessibilityRole="button"
					accessibilityLabel={`${venueName}까지 길찾기`}
				>
					<Ionicons name="navigate-outline" size={20} className="text-white" />
				</Pressable>
				{distanceText && (
					<Text className="text-black/45 text-[11px] font-pretendard-medium mt-1.5">
						{distanceText}
					</Text>
				)}
			</View>
		</View>
	);
}
