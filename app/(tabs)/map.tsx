import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { NaverMapView } from '@mj-studio/react-native-naver-map';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchBar } from '@/src/components/common/SearchBar';
import { ClusterMarker } from '@/src/components/map/ClusterMarker';
import { FilterChips } from '@/src/components/map/FilterChips';
import { VenueSheet } from '@/src/components/map/VenueSheet';
import { ZoomControls } from '@/src/components/map/ZoomControls';
import { venueGroups } from '@/src/data/venues';
import { useMapCamera, DEFAULT_CAMERA } from '@/src/hooks/useMapCamera';
import { useMapFilter } from '@/src/hooks/useMapFilter';
import { useMapStore } from '@/src/store/mapStore';
import {
	computeClusters,
	distanceKm,
	formatDistance,
	latOffsetForPixels,
	type Cluster,
} from '@/src/utils/mapUtils';

const MARKER_ZOOM = 14;

export default function MapScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const bottomSheetRef = useRef<BottomSheetModal>(null);

	const { mapRef, cameraRef, currentCoord, displayZoom, handleCameraChanged } =
		useMapCamera();

	const { selectedVenueName, selectVenue, clearSelection } = useMapStore();
	const {
		searchText,
		setSearchText,
		activeFilters,
		filterDate,
		setFilterDate,
		showDatePicker,
		setShowDatePicker,
		mapVenues,
		matchesFilters,
		toggleFilter,
	} = useMapFilter();

	const [headerHeight, setHeaderHeight] = useState(320);

	const snapPoints = useMemo(() => [headerHeight + 28, '90%'], [headerHeight]);

	const clusters = useMemo(
		() => computeClusters(mapVenues, displayZoom),
		[mapVenues, displayZoom],
	);

	const selectedVenue = useMemo(
		() => venueGroups.find((v) => v.venueName === selectedVenueName) ?? null,
		[selectedVenueName],
	);

	const distanceText = useMemo(() => {
		if (!currentCoord || !selectedVenue) return null;
		const km = distanceKm(
			currentCoord.latitude,
			currentCoord.longitude,
			selectedVenue.coordinates.latitude,
			selectedVenue.coordinates.longitude,
		);
		return formatDistance(km);
	}, [currentCoord, selectedVenue]);

	// 검색 결과 1개일 때 카메라 자동 이동
	useEffect(() => {
		if (mapVenues.length === 1) {
			const v = mapVenues[0];
			const offset = latOffsetForPixels(MARKER_ZOOM, -25);
			mapRef.current?.animateCameraTo({
				latitude: v.coordinates.latitude + offset,
				longitude: v.coordinates.longitude,
				zoom: MARKER_ZOOM,
			});
		}
	}, [mapVenues, mapRef]);

	const handleMarkerPress = useCallback(
		(venueName: string, lat: number, lon: number) => {
			selectVenue(venueName);
			bottomSheetRef.current?.present();
			const offset = latOffsetForPixels(MARKER_ZOOM, -25);
			mapRef.current?.animateCameraTo({
				latitude: lat + offset,
				longitude: lon,
				zoom: MARKER_ZOOM,
			});
		},
		[selectVenue, mapRef],
	);

	const handleClusterPress = useCallback(
		(cluster: Cluster) => {
			if (cluster.venues.length === 1) {
				const v = cluster.venues[0];
				handleMarkerPress(
					v.venueName,
					v.coordinates.latitude,
					v.coordinates.longitude,
				);
			} else {
				mapRef.current?.animateCameraTo({
					latitude: cluster.latitude,
					longitude: cluster.longitude,
					zoom: Math.min(cameraRef.current.zoom + 2, 17),
				});
			}
		},
		[handleMarkerPress, mapRef, cameraRef],
	);

	const handleLocate = useCallback(() => {
		if (!currentCoord) return;
		mapRef.current?.animateCameraTo({ ...currentCoord, zoom: 12 });
		bottomSheetRef.current?.dismiss();
		clearSelection();
	}, [currentCoord, mapRef, clearSelection]);

	const handleGoToExhibition = useCallback(
		(exhibitionId: string) => {
			router.push(`/(explore)/${exhibitionId}` as never);
			bottomSheetRef.current?.dismiss();
		},
		[router],
	);

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
		<View className='flex-1 bg-black'>
			{/* 지도 */}
			<NaverMapView
				ref={mapRef}
				style={{ flex: 1 }}
				mapType='Basic'
				initialCamera={DEFAULT_CAMERA}
				isIndoorEnabled={false}
				isShowZoomControls={false}
				locationOverlay={
					currentCoord ? { isVisible: true, position: currentCoord } : undefined
				}
				onCameraChanged={handleCameraChanged}
			>
				{clusters.map((cluster) => {
					const key = cluster.venues.map((v) => v.venueName).join('|');
					return (
						<ClusterMarker
							key={key}
							cluster={cluster}
							selectedVenueName={selectedVenueName}
							activeFilters={activeFilters}
							matchesFilters={matchesFilters}
							onTap={handleClusterPress}
						/>
					);
				})}
			</NaverMapView>

			{/* 필터 칩 */}
			<FilterChips
				topOffset={insets.top + 56}
				filterDate={filterDate}
				activeFilters={activeFilters}
				toggleFilter={toggleFilter}
				onDatePress={() => setShowDatePicker(true)}
			/>

			{/* 검색 바 */}
			<View
				className='absolute left-4 right-4'
				style={{ top: insets.top + 12, zIndex: 20 }}
			>
				<SearchBar
					value={searchText}
					onChangeText={setSearchText}
					placeholder='미술관 또는 전시 검색'
				/>
			</View>

			{/* 검색 결과 없음 */}
			{searchText.length > 0 && mapVenues.length === 0 && (
				<View
					className='absolute left-4 right-4 items-center bg-white rounded-2xl px-4 py-3'
					style={{
						top: insets.top + 56,
						zIndex: 20,
						shadowColor: '#000',
						shadowOpacity: 0.1,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 2 },
						elevation: 4,
					}}
				>
					<Text className='text-sm font-pretendard-medium text-black/40'>
						"{searchText}"에 해당하는 미술관이 없어요
					</Text>
				</View>
			)}

			{/* 줌 버튼 */}
			<ZoomControls mapRef={mapRef} cameraRef={cameraRef} />

			{/* 날짜 피커 모달 */}
			<DatePickerModal
				visible={showDatePicker}
				value={filterDate}
				onChange={setFilterDate}
				onDismiss={() => setShowDatePicker(false)}
				onReset={() => setFilterDate(new Date())}
			/>

			{/* FAB - 현재 위치 */}
			<Pressable
				onPress={handleLocate}
				className='absolute right-5 bottom-8 w-12 h-12 rounded-full items-center justify-center bg-[rgba(15,14,13,0.92)] border border-white/15'
				style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
				accessibilityLabel='내 위치로 이동'
				accessibilityRole='button'
			>
				<Ionicons name='locate-outline' size={22} color='white' />
			</Pressable>

			{/* 바텀시트 */}
			<BottomSheetModal
				ref={bottomSheetRef}
				index={0}
				snapPoints={snapPoints}
				onChange={(index) => {
					if (index === -1) clearSelection();
				}}
				backgroundStyle={{ backgroundColor: '#F5F3EF' }}
				handleIndicatorStyle={{
					backgroundColor: 'rgba(0,0,0,0.15)',
					width: 40,
					height: 4,
					borderRadius: 2,
				}}
				backdropComponent={renderBackdrop}
			>
				{selectedVenue && (
					<VenueSheet
						venue={selectedVenue}
						filterDate={filterDate}
						distanceText={distanceText}
						onLayout={setHeaderHeight}
						onGoToExhibition={handleGoToExhibition}
					/>
				)}
			</BottomSheetModal>
		</View>
	);
}
