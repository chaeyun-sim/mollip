import { Ionicons } from '@expo/vector-icons';
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { EXHIBITIONS } from '@/src/data/exhibitions';
import { useMapStore } from '@/src/store/mapStore';

const DARK_MAP_STYLE = [
	{ elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
	{ elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
	{ elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
	{
		featureType: 'road',
		elementType: 'geometry',
		stylers: [{ color: '#2b2b3b' }],
	},
	{
		featureType: 'road',
		elementType: 'geometry.stroke',
		stylers: [{ color: '#212a37' }],
	},
	{
		featureType: 'road',
		elementType: 'labels.text.fill',
		stylers: [{ color: '#9ca5b3' }],
	},
	{
		featureType: 'water',
		elementType: 'geometry',
		stylers: [{ color: '#17263c' }],
	},
	{ featureType: 'poi', stylers: [{ visibility: 'off' }] },
	{ featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const DEFAULT_REGION: Region = {
	latitude: 37.5665,
	longitude: 126.978,
	latitudeDelta: 0.15,
	longitudeDelta: 0.15,
};

const exhibitionsWithCoords = EXHIBITIONS.filter((ex) => ex.coordinates);

export default function MapScreen() {
	const router = useRouter();
	const mapRef = useRef<MapView>(null);
	const bottomSheetRef = useRef<BottomSheetModal>(null);

	const { selectedExhibitionId, selectExhibition, clearSelection } =
		useMapStore();

	const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

	const snapPoints = useMemo(() => ['50%', '80%'], []);

	const selectedExhibition = useMemo(
		() => EXHIBITIONS.find((ex) => ex.id === selectedExhibitionId),
		[selectedExhibitionId],
	);

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status === 'granted') {
				const loc = await Location.getCurrentPositionAsync({});
				const region: Region = {
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
					latitudeDelta: 0.05,
					longitudeDelta: 0.05,
				};
				setCurrentRegion(region);
				mapRef.current?.animateToRegion(region, 1000);
			}
		})();
	}, []);

	const handleMarkerPress = useCallback(
		(id: string) => {
			selectExhibition(id);
			bottomSheetRef.current?.present();
		},
		[selectExhibition],
	);

	const handleSheetChange = useCallback(
		(index: number) => {
			if (index === -1) {
				clearSelection();
			}
		},
		[clearSelection],
	);

	const handleGoToExhibition = useCallback(() => {
		bottomSheetRef.current?.dismiss();
		setTimeout(
			() => router.push(`/(explore)/${selectedExhibitionId}` as never),
			300,
		);
	}, [selectedExhibitionId, router]);

	const handleLocate = useCallback(() => {
		if (currentRegion) {
			mapRef.current?.animateToRegion(currentRegion, 800);
		}
	}, [currentRegion]);

	const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				opacity={0.5}
			/>
		),
		[],
	);

	return (
		<View className="flex-1">
			<MapView
				ref={mapRef}
				style={{ flex: 1 }}
				initialRegion={DEFAULT_REGION}
				customMapStyle={DARK_MAP_STYLE}
				userInterfaceStyle="dark"
				showsUserLocation
				showsMyLocationButton={false}
				showsCompass={false}
			>
				{exhibitionsWithCoords.map((ex) => (
					<Marker
						key={ex.id}
						coordinate={ex.coordinates!}
						onPress={() => handleMarkerPress(ex.id)}
						tracksViewChanges={false}
					>
						<View
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: ex.posterColor,
								alignItems: 'center',
								justifyContent: 'center',
								borderWidth: 2,
								borderColor: 'rgba(255,255,255,0.3)',
								shadowColor: '#000',
								shadowOpacity: 0.3,
								shadowRadius: 4,
							}}
						>
							<Ionicons
								name="image-outline"
								size={18}
								color="rgba(0,0,0,0.6)"
							/>
						</View>
					</Marker>
				))}
			</MapView>

			{/* FAB - 현재 위치로 이동 */}
			<Pressable
				onPress={handleLocate}
				className="absolute right-5 bottom-8 w-12 h-12 rounded-full items-center justify-center"
				style={{
					backgroundColor: 'rgba(26,25,24,0.95)',
					borderWidth: 1,
					borderColor: 'rgba(255,255,255,0.15)',
				}}
			>
				<Ionicons name="locate-outline" size={22} color="white" />
			</Pressable>

			{/* 바텀시트 */}
			<BottomSheetModal
				ref={bottomSheetRef}
				index={0}
				snapPoints={snapPoints}
				onChange={handleSheetChange}
				backgroundStyle={{ backgroundColor: '#1A1918' }}
				handleIndicatorStyle={{
					backgroundColor: 'rgba(255,255,255,0.25)',
					width: 40,
					height: 4,
					borderRadius: 2,
				}}
				backdropComponent={renderBackdrop}
			>
				{selectedExhibition ? (
					<BottomSheetScrollView
						className="px-5 pt-2"
						showsVerticalScrollIndicator={false}
					>
						{/* 포스터 이미지 */}
						{selectedExhibition.posterImage ? (
							<Image
								source={selectedExhibition.posterImage}
								className="w-full h-48 rounded-xl mb-4"
								resizeMode="cover"
							/>
						) : (
							<View
								className="w-full h-48 rounded-xl mb-4 items-center justify-center"
								style={{ backgroundColor: selectedExhibition.posterColor }}
							>
								<Ionicons
									name="image-outline"
									size={48}
									color="rgba(0,0,0,0.3)"
								/>
							</View>
						)}

						{/* 제목 & 장소 */}
						<Text className="text-white text-2xl font-hahmlet-bold mb-1">
							{selectedExhibition.title}
						</Text>
						<Text className="text-white/60 text-sm font-pretendard-regular mb-4">
							{selectedExhibition.venue}
						</Text>

						{/* 정보 행 */}
						<View className="gap-2.5 mb-4">
							<View className="flex-row items-center gap-2.5">
								<Ionicons
									name="time-outline"
									size={16}
									color="rgba(255,255,255,0.5)"
								/>
								<Text className="text-white/70 text-sm font-pretendard-regular">
									{selectedExhibition.openHours}
								</Text>
							</View>

							{selectedExhibition.closedDays && (
								<View className="flex-row items-center gap-2.5">
									<Ionicons
										name="close-circle-outline"
										size={16}
										color="rgba(255,255,255,0.5)"
									/>
									<Text className="text-white/70 text-sm font-pretendard-regular">
										{selectedExhibition.closedDays}
									</Text>
								</View>
							)}

							<View className="flex-row items-center gap-2.5">
								<Ionicons
									name="ticket-outline"
									size={16}
									color="rgba(255,255,255,0.5)"
								/>
								<Text className="text-white/70 text-sm font-pretendard-regular">
									{selectedExhibition.admission}
								</Text>
							</View>
						</View>

						{/* 구분선 */}
						<View
							className="h-px mb-4"
							style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
						/>

						{/* 작품 섹션 */}
						<Text className="text-white text-base font-pretendard-semibold mb-3">
							작품
						</Text>

						<FlatList
							data={selectedExhibition.artworks}
							keyExtractor={(item) => item.id}
							horizontal
							showsHorizontalScrollIndicator={false}
							className="mb-5"
							contentContainerStyle={{ gap: 12 }}
							renderItem={({ item }) => (
								<View className="w-28">
									<View
										className="w-28 h-28 rounded-lg mb-2 items-center justify-center"
										style={{ backgroundColor: item.thumbnailColor }}
									>
										<Ionicons
											name="image-outline"
											size={24}
											color="rgba(0,0,0,0.25)"
										/>
									</View>
									<Text
										className="text-white text-xs font-pretendard-medium"
										numberOfLines={1}
									>
										{item.title}
									</Text>
									<Text
										className="text-white/50 text-[11px] font-pretendard-regular"
										numberOfLines={1}
									>
										{item.artist}
									</Text>
								</View>
							)}
						/>

						{/* CTA 버튼 */}
						<Pressable
							onPress={handleGoToExhibition}
							className="rounded-xl py-3.5 items-center mb-8"
							style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
						>
							<Text className="text-white text-[15px] font-pretendard-semibold">
								전시 자세히 보기
							</Text>
						</Pressable>
					</BottomSheetScrollView>
				) : (
					<View />
				)}
			</BottomSheetModal>
		</View>
	);
}
