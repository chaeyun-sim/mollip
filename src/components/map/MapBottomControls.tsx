import type BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import type { RefObject } from 'react';

import type { DirectionsStatus } from '@/src/hooks/useDirections';

interface MapBottomControlsProps {
	onLocate: () => void;
	selectedVenueName: string | null;
	isVenueSheetOpen: boolean;
	directionsStatus: DirectionsStatus;
	onOpenVenueSheet: () => void;
	routeSheetRef: RefObject<BottomSheet | null>;
}

export function MapBottomControls({
	onLocate,
	selectedVenueName,
	isVenueSheetOpen,
	directionsStatus,
	onOpenVenueSheet,
	routeSheetRef,
}: MapBottomControlsProps) {
	return (
		<>
			{/* FAB - 현재 위치 */}
			<Pressable
				onPress={onLocate}
				className="absolute right-5 bottom-8 w-12 h-12 rounded-full items-center justify-center bg-[rgba(15,14,13,0.92)] border border-white/15"
				style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
				accessibilityLabel="내 위치로 이동"
				accessibilityRole="button"
			>
				<Ionicons name="locate-outline" size={22} color="white" />
			</Pressable>

			{/* 선택된 핀이 있지만 venue 시트가 닫힌 경우 재오픈 버튼 */}
			{selectedVenueName && !isVenueSheetOpen && directionsStatus === 'idle' && (
				<Pressable
					onPress={onOpenVenueSheet}
					className="absolute left-5 bottom-8 flex-row items-center gap-2 h-12 px-5 rounded-full bg-[rgba(15,14,13,0.92)] border border-white/15"
					style={{ zIndex: 50 }}
					accessibilityLabel="장소 정보 보기"
					accessibilityRole="button"
				>
					<Ionicons name="business-outline" size={16} color="white" />
					<Text className="text-white text-[13px] font-pretendard-bold">장소 정보 보기</Text>
				</Pressable>
			)}

			{/* 길찾기 패널을 다시 열 수 있는 버튼 */}
			{directionsStatus !== 'idle' && directionsStatus !== 'planning' && (
				<Pressable
					onPress={() => routeSheetRef.current?.snapToIndex(1)}
					className="absolute left-5 bottom-8 flex-row items-center gap-2 h-12 px-5 rounded-full bg-[rgba(15,14,13,0.92)] border border-white/15"
					style={({ pressed }) => ({ zIndex: 50, opacity: pressed ? 0.6 : 1 })}
					accessibilityLabel="경로 패널 다시 보기"
					accessibilityRole="button"
				>
					<Ionicons name="navigate" size={16} color="white" />
					<Text className="text-white text-[13px] font-pretendard-bold">경로 보기</Text>
				</Pressable>
			)}
		</>
	);
}
