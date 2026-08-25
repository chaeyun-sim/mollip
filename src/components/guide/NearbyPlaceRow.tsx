import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ExternalMapTarget } from '@/src/components/common/ExternalMapSheet';
import type { NearbyPlace } from '@/src/hooks/useNearbyPlaces';

export type PlaceVariant = 'cafe' | 'attraction';

const PLACE_VARIANT_STYLE: Record<
	PlaceVariant,
	{ icon: keyof typeof Ionicons.glyphMap; tint: string; iconColor: string }
> = {
	cafe: { icon: 'cafe', tint: '#F2E8DC', iconColor: '#B08863' },
	attraction: { icon: 'image', tint: '#E4ECFB', iconColor: '#5B82D6' },
};

interface NearbyPlaceRowProps {
	place: NearbyPlace;
	variant: PlaceVariant;
	isFirst: boolean;
	onOpenExternalMap: (target: ExternalMapTarget) => void;
}

export function NearbyPlaceRow({
	place,
	variant,
	isFirst,
	onOpenExternalMap,
}: NearbyPlaceRowProps) {
	const { icon, tint, iconColor } = PLACE_VARIANT_STYLE[variant];

	return (
		<View
			className="flex-row items-center gap-3 py-3 border-border"
			style={{ borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth }}
		>
			{/* 실제 사진 대신 카테고리 아이콘 — 지역 검색 API가 이미지를 제공하지 않음 */}
			<View
				className="w-12 h-12 rounded-full items-center justify-center"
				style={{ backgroundColor: tint }}
			>
				<Ionicons name={icon} size={22} color={iconColor} />
			</View>
			<View className="flex-1 min-w-0">
				<Text className="text-primary font-pretendard-semibold text-[14px]" numberOfLines={1}>
					{place.name}
				</Text>
				<Text
					className="text-tertiary font-pretendard-regular text-[12px] mt-0.5"
					numberOfLines={1}
				>
					{place.distance}
				</Text>
			</View>
			<Pressable
				onPress={() =>
					onOpenExternalMap({
						coord: { latitude: place.latitude, longitude: place.longitude },
						label: place.name,
					})
				}
				hitSlop={8}
				className="w-8 h-8 items-center justify-center"
				accessibilityRole="button"
				accessibilityLabel={`${place.name} 외부 지도 앱에서 열기`}
			>
				<Ionicons name="share-outline" size={18} className="text-muted" />
			</Pressable>
		</View>
	);
}
