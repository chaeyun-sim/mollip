import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { NaverMapPathOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchBar } from '@/src/components/common/SearchBar';
import { FilterChips } from '@/src/components/map/FilterChips';
import { RoutePanel } from '@/src/components/map/RoutePanel';
import { VenueMarker } from '@/src/components/map/VenueMarker';
import { VenueSheet } from '@/src/components/map/VenueSheet';
import { ZoomControls } from '@/src/components/map/ZoomControls';
import { venueGroups } from '@/src/data/venues';
import { useDirections } from '@/src/hooks/useDirections';
import { useMapCamera, DEFAULT_CAMERA } from '@/src/hooks/useMapCamera';
import { useMapFilter } from '@/src/hooks/useMapFilter';
import { useMuseums } from '@/src/hooks/useMuseums';
import { useVenueExhibitions } from '@/src/hooks/useVenueExhibitions';
import { useMapStore } from '@/src/store/mapStore';
import { declutterMarkers, distanceKm, formatDistance, latOffsetForPixels } from '@/src/utils/mapUtils';

const ROUTE_LEG_COLOR: Record<'walk' | 'bus' | 'subway', string> = {
	walk: '#1C1917',
	bus: '#2563EB',
	subway: '#16A34A',
};

const MARKER_ZOOM = 14;

export default function MapScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	// 전시 상세로 이동하기 위해 프로그램적으로 시트를 닫을 때는 선택 상태를 지우지 않도록 하는 플래그.
	const suppressClearOnDismissRef = useRef(false);

	const { mapRef, cameraRef, currentCoord, displayZoom, handleCameraChanged } =
		useMapCamera();

	const { selectedVenueName, selectVenue, clearSelection } = useMapStore();
	const museumVenues = useMuseums();
	const { mode: directionsMode, route, status: directionsStatus, fetchRoute, clearRoute } =
		useDirections();
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
	} = useMapFilter(museumVenues);

	// 고정된 스냅 지점만 사용 — 탭 전환 등으로 콘텐츠 길이가 바뀌어도 시트 높이가 흔들리지 않도록
	// enableDynamicSizing을 끄고, 넘치는 콘텐츠는 시트 내부 스크롤로 처리한다.
	const snapPoints = useMemo(() => ['30%', '50%', '92%'], []);

	// 카카오맵처럼 좌표를 옮기지 않고, 밀집 지역에서만 큰 마커 대신 점으로 줄인다.
	const { full: fullMarkerVenues, dots: dotVenues } = useMemo(
		() => declutterMarkers(mapVenues, displayZoom, selectedVenueName, filterDate),
		[mapVenues, displayZoom, selectedVenueName, filterDate],
	);

	const selectedVenue = useMemo(
		() =>
			[...venueGroups, ...museumVenues].find(
				(v) => v.venueName === selectedVenueName,
			) ?? null,
		[selectedVenueName, museumVenues],
	);

	// 정적 데이터 유무와 상관없이 항상 이름으로 전시 API(KCISA + 수동 큐레이션)를 조회해 보강한다.
	// 정적 큐레이션 데이터만으로는 실제 진행 중인 전시를 놓칠 수 있기 때문.
	const { exhibitions: apiExhibitions } = useVenueExhibitions(selectedVenueName);

	const displayVenue = useMemo(() => {
		if (!selectedVenue) return null;
		// 미술관 API로 추가된 마커는 주소가 없는데, 같은 장소의 API 전시 데이터에는
		// 주소(institutionInfo 보강분)가 있는 경우가 있어 그걸로 보강한다.
		const venueAddress =
			selectedVenue.venueAddress ?? apiExhibitions.find((ex) => ex.venueAddress)?.venueAddress;
		if (apiExhibitions.length === 0) return { ...selectedVenue, venueAddress };
		const merged = new Map(selectedVenue.exhibitions.map((ex) => [ex.id, ex]));
		for (const ex of apiExhibitions) merged.set(ex.id, ex);
		return { ...selectedVenue, venueAddress, exhibitions: Array.from(merged.values()) };
	}, [selectedVenue, apiExhibitions]);

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
			clearRoute(); // 다른 장소를 고르면 이전 장소로의 경로는 의미가 없어지니 지운다
			bottomSheetRef.current?.present();
			const offset = latOffsetForPixels(MARKER_ZOOM, -25);
			mapRef.current?.animateCameraTo({
				latitude: lat + offset,
				longitude: lon,
				zoom: MARKER_ZOOM,
			});
		},
		[selectVenue, mapRef, clearRoute],
	);

	const handleLocate = useCallback(() => {
		if (!currentCoord) return;
		mapRef.current?.animateCameraTo({ ...currentCoord, zoom: 12 });
		bottomSheetRef.current?.dismiss();
		clearSelection();
		clearRoute();
	}, [currentCoord, mapRef, clearSelection, clearRoute]);

	const handleRequestDirections = useCallback(
		(mode: 'walk' | 'bus' = 'walk') => {
			if (!currentCoord || !selectedVenue) return;
			fetchRoute(currentCoord, selectedVenue.coordinates, '현재 위치', selectedVenue.venueName, mode);
		},
		[currentCoord, selectedVenue, fetchRoute],
	);

	const handleGoToExhibition = useCallback(
		(exhibitionId: string) => {
			// 시트가 화면 최상단에 떠 있어서 상세 페이지를 가리므로 일단 닫지만, 선택 상태는
			// 지우지 않는다 — 뒤로가기로 지도 탭에 돌아오면 useFocusEffect가 같은 장소를 다시 연다.
			suppressClearOnDismissRef.current = true;
			bottomSheetRef.current?.dismiss();
			router.push(`/(explore)/${exhibitionId}` as never);
		},
		[router],
	);

	// 상세 화면에서 뒤로가기로 지도 탭에 돌아왔을 때, 선택이 남아있으면 시트를 다시 연다.
	useFocusEffect(
		useCallback(() => {
			if (selectedVenueName) {
				bottomSheetRef.current?.present();
			}
		}, [selectedVenueName]),
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
				{/* 점(dot) 먼저, 큰 마커를 나중에 그려서 겹칠 때 큰 마커가 위로 오게 한다 */}
				{dotVenues.map((venue) => (
					<VenueMarker
						key={venue.venueName}
						venue={venue}
						variant='dot'
						isSelected={false}
						activeFilters={activeFilters}
						matchesFilters={matchesFilters}
						onTap={(v) =>
							handleMarkerPress(v.venueName, v.coordinates.latitude, v.coordinates.longitude)
						}
					/>
				))}
				{fullMarkerVenues.map((venue) => (
					<VenueMarker
						key={venue.venueName}
						venue={venue}
						variant='full'
						isSelected={venue.venueName === selectedVenueName}
						activeFilters={activeFilters}
						matchesFilters={matchesFilters}
						onTap={(v) =>
							handleMarkerPress(v.venueName, v.coordinates.latitude, v.coordinates.longitude)
						}
					/>
				))}
				{route?.legs.map((leg, i) => (
					<NaverMapPathOverlay
						key={i}
						coords={leg.coords}
						width={5}
						color={ROUTE_LEG_COLOR[leg.mode]}
						outlineWidth={1.5}
						outlineColor='white'
					/>
				))}
			</NaverMapView>

			{/* 경로 패널 */}
			{directionsStatus !== 'idle' && (
				<RoutePanel
					mode={directionsMode}
					status={directionsStatus}
					distanceMeters={route?.distanceMeters}
					durationSeconds={route?.durationSeconds}
					onChangeMode={handleRequestDirections}
					onClose={clearRoute}
					topOffset={insets.top + 108}
				/>
			)}

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
				index={1}
				snapPoints={snapPoints}
				enableDynamicSizing={false}
				onChange={(index) => {
					if (index !== -1) return;
					if (suppressClearOnDismissRef.current) {
						suppressClearOnDismissRef.current = false;
						return;
					}
					clearSelection();
					clearRoute();
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
				{displayVenue && (
					<VenueSheet
						venue={displayVenue}
						filterDate={filterDate}
						distanceText={distanceText}
						onGoToExhibition={handleGoToExhibition}
						onRequestDirections={() => handleRequestDirections('walk')}
					/>
				)}
			</BottomSheetModal>
		</View>
	);
}
