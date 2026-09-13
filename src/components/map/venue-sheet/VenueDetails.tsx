import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import type { VenueGroup } from '@/src/data/venues';

interface VenueDetailsProps {
	activeVenue: VenueGroup;
}

export function VenueDetails({ activeVenue }: VenueDetailsProps) {
	return (
		<View>
			<View className="mt-2 mb-5">
				{activeVenue.description && (
					<Text
						className="text-black/65 text-[13px] font-pretendard-regular leading-[19px]"
						numberOfLines={3}
					>
						{activeVenue.description}
					</Text>
				)}
				{activeVenue.homepageUrl && (
					<Pressable
						onPress={() => WebBrowser.openBrowserAsync(activeVenue.homepageUrl!)}
						hitSlop={8}
						className="flex-row items-center gap-1 mt-2"
						accessibilityLabel="홈페이지로 이동"
						accessibilityRole="link"
					>
						<Text className="text-black text-[13px] font-pretendard-semibold">홈페이지</Text>
						<Ionicons name="arrow-up-outline" size={11} className="text-gray900 rotate-45" />
					</Pressable>
				)}
				{activeVenue.note && (
					<View className="mt-3 px-3.5 py-3 rounded-2xl bg-black/4 flex-row gap-2.5">
						<Ionicons name="information-circle-outline" size={15} className="text-black/45 mt-px" />
						<Text className="flex-1 text-[13px] leading-[20px] text-black/55 font-pretendard-regular">
							{activeVenue.note}
						</Text>
					</View>
				)}
			</View>

			{activeVenue.amenities && activeVenue.amenities.length > 0 && (
				<View className="flex-row flex-wrap gap-1.5 mb-5">
					{activeVenue.amenities.map((amenity) => (
						<View key={amenity} className="rounded-full px-2.5 py-1 bg-black/4">
							<Text className="text-black/55 text-xs font-pretendard-medium">{amenity}</Text>
						</View>
					))}
				</View>
			)}
		</View>
	);
}
