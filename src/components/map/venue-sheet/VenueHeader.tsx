import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import { HoursSection } from '@/src/components/map/venue-sheet/HoursSection';
import type { VenueGroup } from '@/src/data/venues';
import { copyVenueAddress, openPhoneDialer } from '@/src/utils/venueContactActions';

interface VenueHeaderProps {
	activeVenue: VenueGroup;
	filterDate: Date;
}

export function VenueHeader({ activeVenue, filterDate }: VenueHeaderProps) {
	const { t, i18n } = useTranslation();
	const [showWeeklyHours, setShowWeeklyHours] = useState(false);

	const isEn = i18n.language === 'en';
	const address = (isEn && activeVenue.venueAddressEn) || activeVenue.venueAddress;
	// 편의시설은 영문 데이터가 없어 영어 설정에서는 숨긴다
	const amenities = isEn ? undefined : activeVenue.amenities;

	const handleCallVenue = async () => {
		const ok = await openPhoneDialer(activeVenue.phone!);
		if (!ok) {
			Alert.alert(t('map.venue.phone_error_title'), t('map.venue.phone_error_message'));
		}
	};

	return (
		<View className="gap-2">
			<View className="gap-1.5">
				<Pressable
					onPress={() => setShowWeeklyHours((prev) => !prev)}
					className="flex-row items-center gap-1"
					accessibilityRole="button"
					accessibilityLabel={t('map.venue.weekly_toggle_a11y')}
					accessibilityState={{ expanded: showWeeklyHours }}
				>
					<HoursSection
						openHours={activeVenue.openHours}
						closedDays={activeVenue.closedDays}
						filterDate={filterDate}
					/>
					<Ionicons
						name={showWeeklyHours ? 'chevron-up' : 'chevron-down'}
						size={12}
						className="text-gray600"
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
						accessibilityHint={t('map.venue.address_hint')}
						accessibilityLabel={t('map.venue.address_a11y', { address })}
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
					accessibilityLabel={t('map.venue.phone_a11y', { phone: activeVenue.phone })}
					accessibilityHint={t('map.venue.phone_hint')}
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

			{amenities && amenities.length > 0 && (
				<View className="flex-row items-start gap-2">
					<Ionicons name="heart-half-outline" size={16} className="mt-0.5 text-gray600" />
					<Text className="flex-1 text-[13px] leading-[19px] font-pretendard-medium text-gray700">
						{amenities.join(', ')}
					</Text>
				</View>
			)}
		</View>
	);
}
