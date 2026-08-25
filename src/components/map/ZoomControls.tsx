import type { MutableRefObject, RefObject } from 'react';
import { Pressable, View, type DimensionValue } from 'react-native';
import type { NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { Ionicons } from '@expo/vector-icons';

interface ZoomControlsProps {
	mapRef: RefObject<NaverMapViewRef | null>;
	cameraRef: MutableRefObject<{ latitude: number; longitude: number; zoom: number }>;
	bottomOffset?: DimensionValue;
}

const BUTTONS = [
	{ icon: 'add', label: '지도 확대', delta: 1 },
	{ icon: 'remove', label: '지도 축소', delta: -1 },
] as const;

export function ZoomControls({ mapRef, cameraRef, bottomOffset = 96 }: ZoomControlsProps) {
	return (
		<View
			className="absolute right-5 bg-[rgba(15,14,13,0.92)] border border-white/15 rounded-xl overflow-hidden"
			style={{ bottom: bottomOffset }}
		>
			{BUTTONS.map(({ icon, label, delta }, i) => (
				<View key={icon}>
					{i === 1 && <View className="h-px bg-white/15" />}
					<Pressable
						className="w-12 h-12 items-center justify-center"
						style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
						onPress={() => {
							const c = cameraRef.current;
							mapRef.current?.animateCameraTo({
								latitude: c.latitude,
								longitude: c.longitude,
								zoom: c.zoom + delta,
							});
						}}
						accessibilityLabel={label}
						accessibilityRole="button"
					>
						<Ionicons name={icon} size={22} color="white" />
					</Pressable>
				</View>
			))}
		</View>
	);
}
