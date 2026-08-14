import {
	NaverMapMarkerOverlay,
	NaverMapView,
} from '@mj-studio/react-native-naver-map';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useMapStore } from '@/src/store/mapStore';

interface ExhibitionMapPreviewProps {
	coordinates: { latitude: number; longitude: number };
	venueName: string;
}

export function ExhibitionMapPreview({
	coordinates,
	venueName,
}: ExhibitionMapPreviewProps) {
	const router = useRouter();
	const setPendingCamera = useMapStore((s) => s.setPendingCamera);

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setPendingCamera({ ...coordinates, venueName });
		router.push('/(tabs)/map');
	};

	return (
		<Pressable
			onPress={handlePress}
			accessibilityLabel={`${venueName} 지도에서 보기`}
			accessibilityRole='button'
		>
			<View
				className='mx-6 rounded-md overflow-hidden border border-gray-200'
				style={{ height: 160 }}
			>
				<NaverMapView
					style={{ flex: 1 }}
					mapType='Basic'
					initialCamera={{
						latitude: coordinates.latitude,
						longitude: coordinates.longitude,
						zoom: 15,
					}}
					isScrollGesturesEnabled={false}
					isZoomGesturesEnabled={false}
					isRotateGesturesEnabled={false}
					isTiltGesturesEnabled={false}
					isShowLocationButton={false}
					isShowZoomControls={false}
					isShowCompass={false}
					isShowScaleBar={false}
				>
					<NaverMapMarkerOverlay
						latitude={coordinates.latitude}
						longitude={coordinates.longitude}
						width={32}
						height={32}
						anchor={{ x: 0.5, y: 1 }}
					>
						<View
							collapsable={false}
							className='w-8 h-8 rounded-full bg-[#1C1917] items-center justify-center'
							style={{ borderWidth: 2, borderColor: 'white' }}
						>
							<Ionicons name='location' size={14} color='white' />
						</View>
					</NaverMapMarkerOverlay>
				</NaverMapView>

				{/* 지도 탭으로 이동 배지 */}
				<View
					className='absolute bottom-3 right-3 flex-row items-center gap-1 px-2.5 py-1.5 rounded-full bg-white'
					style={{
						shadowColor: '#000',
						shadowOpacity: 0.12,
						shadowRadius: 4,
						shadowOffset: { width: 0, height: 1 },
					}}
				>
					<Ionicons name='map-outline' size={12} color='#1C1917' />
					<Text
						style={{
							fontFamily: 'Pretendard-Medium',
							fontSize: 11,
							color: '#1C1917',
						}}
					>
						지도에서 보기
					</Text>
				</View>
			</View>
		</Pressable>
	);
}
