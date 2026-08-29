import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { useCallback } from 'react';

import type { RouteCoord } from '@/src/api/tmap';
import { EXTERNAL_MAP_APPS, openExternalMap } from '@/src/utils/externalMaps';
import { colors } from '@/src/constants/colors';

export interface ExternalMapTarget {
	coord: RouteCoord;
	label: string;
}

interface ExternalMapSheetProps {
	target: ExternalMapTarget;
	onClose: () => void;
}

// 위치를 외부 지도 앱(네이버/카카오/구글)에서 열기 위한 액션시트.
export function ExternalMapSheet({ target, onClose }: ExternalMapSheetProps) {
	const handlePick = useCallback(
		(app: (typeof EXTERNAL_MAP_APPS)[number]['key']) => {
			onClose();
			openExternalMap(app, target.coord, target.label);
		},
		[target, onClose],
	);

	return (
		<Modal transparent animationType="fade" onRequestClose={onClose}>
			<Pressable
				className="flex-1 justify-end bg-black/35"
				onPress={onClose}
				accessibilityLabel="닫기"
				accessibilityRole="button"
			>
				<Pressable
					className="bg-white rounded-t-[28px] px-5 pt-2 pb-8"
					onPress={(e) => e.stopPropagation()}
				>
					<View className="self-center w-9 h-1 rounded-full bg-black/15 mt-2 mb-4" />
					<Text className="text-black/40 text-[12px] font-pretendard-semibold px-1 mb-2">
						{target.label} · 지도 앱에서 보기
					</Text>
					{EXTERNAL_MAP_APPS.map((app) => (
						<Pressable
							key={app.key}
							onPress={() => handlePick(app.key)}
							className="flex-row items-center gap-3 h-14 px-1"
							accessibilityRole="button"
							accessibilityLabel={app.label}
						>
							<View className="w-9 h-9 rounded-full items-center justify-center bg-black/[0.045]">
								<Ionicons name="map-outline" size={17} color={colors.gray900} />
							</View>
							<Text className="text-[15px] font-pretendard-medium text-gray900">{app.label}</Text>
						</Pressable>
					))}
				</Pressable>
			</Pressable>
		</Modal>
	);
}
