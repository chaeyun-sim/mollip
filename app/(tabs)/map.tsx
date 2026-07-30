import BottomSheet, { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import {
	NaverMapMarkerOverlay,
	NaverMapPathOverlay,
	NaverMapView,
} from '@mj-studio/react-native-naver-map';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchBar } from '@/src/components/common/SearchBar';
import { FilterChips } from '@/src/components/map/FilterChips';
import { RouteSheet } from '@/src/components/map/RouteSheet';
import { VenueMarker } from '@/src/components/map/VenueMarker';
import { VenueSheet } from '@/src/components/map/VenueSheet';
import { ZoomControls } from '@/src/components/map/ZoomControls';
import { venueGroups } from '@/src/data/venues';
import { useDirections, type DirectionsMode } from '@/src/hooks/useDirections';
import { useMapCamera, DEFAULT_CAMERA } from '@/src/hooks/useMapCamera';
import { useMapFilter } from '@/src/hooks/useMapFilter';
import { useMuseums } from '@/src/hooks/useMuseums';
import { useVenueExhibitions } from '@/src/hooks/useVenueExhibitions';
import { useMapStore } from '@/src/store/mapStore';
import { declutterMarkers, distanceKm, formatDistance, latOffsetForPixels } from '@/src/utils/mapUtils';
import { legColor } from '@/src/utils/routeColors';
import type { RouteCoord, RouteLeg } from '@/src/api/tmap';

// 도보만 지도에서 진한 잉크색으로 강조 — 버스/지하철은 legColor(지하철은 호선별)를 그대로 쓴다.
function pathColor(leg: RouteLeg): string {
	return leg.mode === 'walk' ? '#1C1917' : legColor(leg);
}

const MARKER_ZOOM = 14;

export default function MapScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const routeSheetRef = useRef<BottomSheet>(null);
	// 전시 상세로 이동하기 위해 프로그램적으로 시트를 닫을 때는 선택 상태를 지우지 않도록 하는 플래그.
	const suppressClearOnDismissRef = useRef(false);

	const { mapRef, cameraRef, currentCoord, displayZoom, handleCameraChanged } =
		useMapCamera();

	const { selectedVenueName, selectVenue, clearSelection } = useMapStore();
	const museumVenues = useMuseums();
	const {
		mode: directionsMode,
		route,
		routes,
		selectedRouteIndex,
		status: directionsStatus,
		destination,
		fetchRoute,
		selectRoute,
		clearRoute,
	} = useDirections();
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

	// 고정된 스냅 지점만 사용 — 탭 전환이나 로딩/성공/에러 등 콘텐츠 길이가 바뀌어도
	// 시트 높이가 콘텐츠에 맞춰 흔들리면 안 된다. 항상 고정된 snapPoints로만 크기를 정하고,
	// 넘치는 콘텐츠는 시트 내부 스크롤(BottomSheetScrollView)로 처리한다.
	const snapPoints = useMemo(() => ['30%', '50%', '92%'], []);
	// 길찾기 패널도 같은 원칙 — 드래그로 접고 펼 수 있는 진짜 바텀시트이되 높이는 고정 스냅포인트뿐이다.
	const routeSnapPoints = useMemo(() => ['24%', '50%', '85%'], []);

	// 카카오맵처럼 좌표를 옮기지 않고, 밀집 지역에서만 큰 마커 대신 점으로 줄인다.
	const { full: fullMarkerVenues, dots: dotVenues } = useMemo(
		() =>
			declutterMarkers(
				mapVenues,
				displayZoom,
				selectedVenueName,
				filterDate,
				destination?.name ?? null,
			),
		[mapVenues, displayZoom, selectedVenueName, filterDate, destination],
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

	// 경로 조회에 성공하면 출발/도착 두 좌표의 중점이 화면 정중앙에 오도록 카메라를 맞춘다.
	// pivot을 따로 주지 않으면 기본값 0.5(중앙)라 별도 보정 애니메이션 없이 한 번에 끝난다 —
	// 두 단계로 나누면(맞춤 → 위로 보정) 카메라가 튀는 것처럼 보여서 단일 애니메이션으로 처리한다.
	useEffect(() => {
		if (directionsStatus !== 'success' || !route) return;
		const allCoords = route.legs.flatMap((leg) => leg.coords);
		if (allCoords.length === 0) return;

		let minLat = Infinity;
		let maxLat = -Infinity;
		let minLon = Infinity;
		let maxLon = -Infinity;
		for (const c of allCoords) {
			if (c.latitude < minLat) minLat = c.latitude;
			if (c.latitude > maxLat) maxLat = c.latitude;
			if (c.longitude < minLon) minLon = c.longitude;
			if (c.longitude > maxLon) maxLon = c.longitude;
		}

		// 경로가 화면에 꽉 차지 않도록 사방에 여유를 둬서 한 단계 더 축소된 느낌을 준다.
		const latPad = (maxLat - minLat) * 0.25 || 0.0015;
		const lonPad = (maxLon - minLon) * 0.25 || 0.0015;
		mapRef.current?.animateCameraWithTwoCoords({
			coord1: { latitude: minLat - latPad, longitude: minLon - lonPad },
			coord2: { latitude: maxLat + latPad, longitude: maxLon + lonPad },
		});
	}, [route, directionsStatus, mapRef]);

	const handleMarkerPress = useCallback(
		(venueName: string, lat: number, lon: number) => {
			// 다른 장소를 새로 고르면 이전 장소로의 경로는 의미가 없어지니 지운다.
			// 같은 장소를 다시 눌러 상세를 보는 경우는 경로를 유지한다 — X 버튼을 눌러야만 지워진다.
			if (venueName !== selectedVenueName) {
				routeSheetRef.current?.close();
				clearRoute();
			}
			selectVenue(venueName);
			bottomSheetRef.current?.present();
			const offset = latOffsetForPixels(MARKER_ZOOM, -25);
			mapRef.current?.animateCameraTo({
				latitude: lat + offset,
				longitude: lon,
				zoom: MARKER_ZOOM,
			});
		},
		[selectVenue, mapRef, clearRoute, selectedVenueName],
	);

	const handleLocate = useCallback(() => {
		if (!currentCoord) return;
		mapRef.current?.animateCameraTo({ ...currentCoord, zoom: 12 });
		bottomSheetRef.current?.dismiss();
		clearSelection();
	}, [currentCoord, mapRef, clearSelection]);

	const handleRequestDirections = useCallback(
		(mode: DirectionsMode = 'walk') => {
			if (!currentCoord) return;
			// 이미 경로를 보고 있는 중이면(도보/버스 전환) selectedVenue를 다시 조회하지 않고
			// useDirections가 기억해 둔 목적지를 그대로 쓴다 — selectedVenue는 비동기로 로드되는
			// museumVenues 목록에 의존해서 한동안 null이 될 수 있고, 그러면 모드 전환이 조용히 무시됐다.
			const target = selectedVenue
				? { coord: selectedVenue.coordinates, name: selectedVenue.venueName }
				: destination
					? { coord: destination.coord, name: destination.name }
					: null;
			if (!target) return;
			console.log('[DEBUG] 현재 위치', currentCoord, '/ 목적지', target.name, target.coord);
			fetchRoute(currentCoord, target.coord, '현재 위치', target.name, mode);
			bottomSheetRef.current?.dismiss();
			// 길찾기 패널은 모달이 아닌 일반 BottomSheet라 지도를 계속 자유롭게 탭/이동할 수 있고,
			// 손잡이를 드래그해서 접고 펼 수 있다.
			routeSheetRef.current?.snapToIndex(1);
		},
		[currentCoord, selectedVenue, destination, fetchRoute],
	);

	const handleCloseRoute = useCallback(() => {
		routeSheetRef.current?.close();
		clearRoute();
	}, [clearRoute]);

	// 타임라인의 승차/하차 행을 누르면 경로·선택은 그대로 둔 채 그 위치로 카메라만 옮기고
	// 패널을 접어(-1) 지도가 잘 보이게 한다.
	const handleFocusStop = useCallback(
		(coord: RouteCoord) => {
			mapRef.current?.animateCameraTo({ ...coord, zoom: 16 });
			routeSheetRef.current?.close();
		},
		[mapRef],
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
				{route?.legs.map((leg, i) => {
					if (leg.coords.length < 2) return null;
					// 도보 구간은 버스/지하철보다 얇게 표시해 시각적으로 덜 강조한다.
					const isWalk = leg.mode === 'walk';
					return (
						<NaverMapPathOverlay
							key={i}
							coords={leg.coords}
							width={isWalk ? 4 : 5}
							color={pathColor(leg)}
							outlineWidth={1}
							outlineColor='white'
						/>
					);
				})}
				{/* 환승 지점 — 마지막 구간(목적지) 제외, 각 구간이 끝나는 지점에 표시 */}
				{route?.legs.slice(0, -1).map((leg, i) => {
					const point = leg.coords[leg.coords.length - 1];
					if (!point) return null;
					const nextLeg = route.legs[i + 1];
					const nextColor = nextLeg ? pathColor(nextLeg) : pathColor(leg);
					const size = 12;
					return (
						<NaverMapMarkerOverlay
							key={`transfer-${i}`}
							latitude={point.latitude}
							longitude={point.longitude}
							width={size}
							height={size}
							anchor={{ x: 0.5, y: 0.5 }}
							zIndex={50}
						>
							<View
								collapsable={false}
								className='border border-white'
								style={{
									width: size,
									height: size,
									borderRadius: size / 2,
									backgroundColor: nextColor,
								}}
							/>
						</NaverMapMarkerOverlay>
					);
				})}
			</NaverMapView>

			{/* 필터 칩 — 길찾기 모드에서는 숨긴다 */}
			{directionsStatus === 'idle' && (
				<FilterChips
					topOffset={insets.top + 56}
					filterDate={filterDate}
					activeFilters={activeFilters}
					toggleFilter={toggleFilter}
					onDatePress={() => setShowDatePicker(true)}
				/>
			)}

			{/* 검색 바 — 길찾기 모드에서는 숨기고 대신 닫기(X) 버튼을 같은 자리에 둔다 */}
			<View
				className='absolute left-4 right-4'
				style={{ top: insets.top + 12, zIndex: 20 }}
			>
				{directionsStatus === 'idle' ? (
					<SearchBar
						value={searchText}
						onChangeText={setSearchText}
						placeholder='미술관 또는 전시 검색'
					/>
				) : (
					<Pressable
						onPress={handleCloseRoute}
						className='self-start w-11 h-11 items-center justify-center rounded-full bg-white'
						style={{
							shadowColor: '#000',
							shadowOpacity: 0.1,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 2 },
							elevation: 4,
						}}
						hitSlop={6}
						accessibilityLabel='길찾기 닫기'
						accessibilityRole='button'
					>
						<Ionicons name='close' size={22} color='#1C1917' />
					</Pressable>
				)}
			</View>

			{/* 검색 결과 없음 */}
			{directionsStatus === 'idle' && searchText.length > 0 && mapVenues.length === 0 && (
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

			{/* 줌 버튼 — 길찾기 패널은 드래그로 접을 수 있는 진짜 바텀시트라 버튼 위치를 따로 옮기지 않는다 */}
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

			{/* 바텀시트 — 장소 정보 (길찾기 모드에서는 닫혀 있고, 하단 경로 패널이 대신 보인다) */}
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

			{/* 길찾기 패널을 다시 열 수 있는 버튼 — 패널을 드래그로 내려도(index -1) 항상 떠 있고,
			    아래의 BottomSheet가 나중에 그려지며(JSX 순서상 위 레이어) 패널이 열리면 이 버튼을 자연히 덮는다. */}
			{directionsStatus !== 'idle' && (
				<Pressable
					onPress={() => routeSheetRef.current?.snapToIndex(1)}
					className='absolute left-5 bottom-8 flex-row items-center gap-2 h-12 px-5 rounded-full bg-[rgba(15,14,13,0.92)] border border-white/15'
					accessibilityLabel='경로 패널 다시 보기'
					accessibilityRole='button'
				>
					<Ionicons name='navigate' size={16} color='white' />
					<Text className='text-white text-[13px] font-pretendard-bold'>경로 보기</Text>
				</Pressable>
			)}

			{/* 길찾기 패널 — 모달이 아닌 BottomSheet라 지도를 자유롭게 탭/이동해도 닫히지 않고,
			    손잡이로 드래그해서 접고 펼 수 있다. 재오픈 버튼보다 뒤에 그려서 패널이 열렸을 때 버튼을 덮는다. */}
			<BottomSheet
				ref={routeSheetRef}
				index={-1}
				snapPoints={routeSnapPoints}
				enableDynamicSizing={false}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: '#F5F3EF' }}
				handleIndicatorStyle={{
					backgroundColor: 'rgba(0,0,0,0.15)',
					width: 40,
					height: 4,
					borderRadius: 2,
				}}
			>
				{directionsStatus !== 'idle' && (
					<RouteSheet
						mode={directionsMode}
						status={directionsStatus}
						route={route}
						routes={routes}
						selectedRouteIndex={selectedRouteIndex}
						onSelectRoute={selectRoute}
						onChangeMode={handleRequestDirections}
						onFocusStop={handleFocusStop}
						destinationName={destination?.name}
						bottomInset={insets.bottom}
					/>
				)}
			</BottomSheet>
		</View>
	);
}
