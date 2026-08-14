import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetModal,
} from '@gorhom/bottom-sheet';
import {
	NaverMapMarkerOverlay,
	NaverMapPathOverlay,
	NaverMapView,
} from '@mj-studio/react-native-naver-map';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { SearchBar } from '@/src/components/common/SearchBar';
import { FilterChips } from '@/src/components/map/FilterChips';
import { RoutePlanningBar } from '@/src/components/map/RoutePlanningBar';
import { RouteSheet } from '@/src/components/map/RouteSheet';
import { VenueMarker } from '@/src/components/map/VenueMarker';
import { VenueSheet } from '@/src/components/map/VenueSheet';
import { ZoomControls } from '@/src/components/map/ZoomControls';
import { venueGroups } from '@/src/data/venues';
import { useDirections, type DirectionsMode } from '@/src/hooks/useDirections';
import { useMapCamera, DEFAULT_CAMERA } from '@/src/hooks/useMapCamera';
import { useMapFilter } from '@/src/hooks/useMapFilter';
import { useMapVenues } from '@/src/hooks/useMapVenues';
import { useRecentLocations } from '@/src/hooks/useRecentLocations';
import { useVenueExhibitions } from '@/src/hooks/useVenueExhibitions';
import { useMapStore } from '@/src/store/mapStore';
import {
	declutterMarkers,
	distanceKm,
	formatDistance,
	latOffsetForPixels,
} from '@/src/utils/mapUtils';
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

	const { selectedVenueName, selectVenue, clearSelection, pendingCamera, clearPendingCamera } = useMapStore();
	const [filterDate, setFilterDate] = useState(new Date());
	const dbVenues = useMapVenues(filterDate);
	const { recents: recentLocations, addRecent } = useRecentLocations();
	const {
		mode: directionsMode,
		route,
		routes,
		selectedRouteIndex,
		status: directionsStatus,
		origin: routeOrigin,
		destination,
		setOrigin: setRouteOrigin,
		setDestination: setRouteDestination,
		beginPlanning,
		confirmRoute,
		swapEndpoints,
		selectRoute,
		clearRoute,
	} = useDirections();
	const {
		searchText,
		setSearchText,
		activeFilters,
		showDatePicker,
		setShowDatePicker,
		mapVenues,
		matchesFilters,
		toggleFilter,
	} = useMapFilter(dbVenues, filterDate, setFilterDate);

	// 고정된 스냅 지점만 사용 — 탭 전환이나 로딩/성공/에러 등 콘텐츠 길이가 바뀌어도
	// 시트 높이가 콘텐츠에 맞춰 흔들리면 안 된다. 항상 고정된 snapPoints로만 크기를 정하고,
	// 넘치는 콘텐츠는 시트 내부 스크롤(BottomSheetScrollView)로 처리한다.
	const snapPoints = useMemo(() => ['30%', '50%', '92%'], []);
	// 길찾기 패널도 같은 원칙 — 드래그로 접고 펼 수 있는 진짜 바텀시트이되 높이는 고정 스냅포인트뿐이다.
	const routeSnapPoints = useMemo(() => ['24%', '50%', '85%'], []);

	// 카카오맵처럼 좌표를 옮기지 않고, 밀집 지역에서만 큰 마커 대신 점으로 줄인다.
	const pinnedVenueName = useMemo(() => {
		if (directionsStatus === 'idle') return null;
		return destination?.name ?? selectedVenueName;
	}, [directionsStatus, destination?.name, selectedVenueName]);

	const markerVenues = useMemo(() => {
		const pinNames = new Set<string>();
		if (selectedVenueName) pinNames.add(selectedVenueName);
		if (pinnedVenueName) pinNames.add(pinnedVenueName);
		if (pinNames.size === 0) return mapVenues;
		const missing = dbVenues.filter(
			(v) =>
				pinNames.has(v.venueName) &&
				!mapVenues.some((m) => m.venueName === v.venueName),
		);
		return missing.length > 0 ? [...mapVenues, ...missing] : mapVenues;
	}, [mapVenues, dbVenues, selectedVenueName, pinnedVenueName]);

	const { full: fullMarkerVenues, dots: dotVenues } = useMemo(
		() =>
			declutterMarkers(
				markerVenues,
				displayZoom,
				selectedVenueName,
				filterDate,
				pinnedVenueName,
			),
		[markerVenues, displayZoom, selectedVenueName, filterDate, pinnedVenueName],
	);

	const selectedVenue = useMemo(
		() =>
			[...venueGroups, ...dbVenues].find(
				(v) => v.venueName === selectedVenueName,
			) ?? null,
		[selectedVenueName, dbVenues],
	);

	// 하위 미술관을 묶은 부모 venue(예: 예술의전당)는 exhibitions가 이미 useMapVenues에서
	// 하위 미술관별로 채워져 있으므로 추가 API 조회 불필요 — 빈 이름/id를 전달해 쿼리를 건너뛴다.
	const isGroupedVenue = Boolean(selectedVenue?.subVenues?.length);
	const { exhibitions: apiExhibitions } = useVenueExhibitions(
		isGroupedVenue ? null : selectedVenueName,
		isGroupedVenue ? null : selectedVenue?.museumId,
	);

	const displayVenue = useMemo(() => {
		if (!selectedVenue) return null;
		// 미술관 API로 추가된 마커는 주소가 없는데, 같은 장소의 API 전시 데이터에는
		// 주소(institutionInfo 보강분)가 있는 경우가 있어 그걸로 보강한다.
		const venueAddress =
			selectedVenue.venueAddress ??
			apiExhibitions.find((ex) => ex.venueAddress)?.venueAddress;
		if (apiExhibitions.length === 0) return { ...selectedVenue, venueAddress };
		const merged = new Map(selectedVenue.exhibitions.map((ex) => [ex.id, ex]));
		for (const ex of apiExhibitions) merged.set(ex.id, ex);
		return {
			...selectedVenue,
			venueAddress,
			exhibitions: Array.from(merged.values()),
		};
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
		// 바텀시트에 가리지 않도록 아래쪽 여유를 위쪽보다 크게 준다.
		const latPad = (maxLat - minLat) * 0.25 || 0.0015;
		const lonPad = (maxLon - minLon) * 0.25 || 0.0015;
		mapRef.current?.animateCameraWithTwoCoords({
			coord1: { latitude: minLat - latPad * 20, longitude: minLon - lonPad },
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

	const handleBeginDirections = useCallback(() => {
		if (!selectedVenue) return;
		suppressClearOnDismissRef.current = true;
		beginPlanning(
			{ name: selectedVenue.venueName, coord: selectedVenue.coordinates },
			currentCoord ? { name: '현재 위치', coord: currentCoord } : null,
		);
		bottomSheetRef.current?.dismiss();
	}, [selectedVenue, currentCoord, beginPlanning]);

	const handleConfirmRoutePlan = useCallback(async () => {
		await confirmRoute('walk');
		routeSheetRef.current?.snapToIndex(1);
	}, [confirmRoute]);

	const handleRequestDirections = useCallback(
		(mode: DirectionsMode = 'walk') => {
			void confirmRoute(mode);
		},
		[confirmRoute],
	);

	const handleCloseRoute = useCallback(() => {
		routeSheetRef.current?.close();
		clearRoute();
		clearSelection();
	}, [clearRoute, clearSelection]);

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

	// 전시 상세에서 지도 탭으로 진입 시 해당 위치로 카메라 이동
	useFocusEffect(
		useCallback(() => {
			if (!pendingCamera) return;
			const offset = latOffsetForPixels(MARKER_ZOOM, -25);
			mapRef.current?.animateCameraTo({
				latitude: pendingCamera.latitude + offset,
				longitude: pendingCamera.longitude,
				zoom: MARKER_ZOOM,
			});
			selectVenue(pendingCamera.venueName);
			bottomSheetRef.current?.present();
			clearPendingCamera();
		}, [pendingCamera, mapRef, selectVenue, clearPendingCamera]),
	);

	// 상세 화면에서 뒤로가기로 지도 탭에 돌아왔을 때, 선택이 남아있으면 시트를 다시 연다.
	useFocusEffect(
		useCallback(() => {
			if (selectedVenueName && directionsStatus === 'idle') {
				bottomSheetRef.current?.present();
			}
		}, [selectedVenueName, directionsStatus]),
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
							handleMarkerPress(
								v.venueName,
								v.coordinates.latitude,
								v.coordinates.longitude,
							)
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
							handleMarkerPress(
								v.venueName,
								v.coordinates.latitude,
								v.coordinates.longitude,
							)
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

			{/* 필터 칩 — 길찾기·출발/도착 설정 중에는 숨긴다 */}
			{directionsStatus === 'idle' && (
				<FilterChips
					topOffset={insets.top + 56}
					filterDate={filterDate}
					activeFilters={activeFilters}
					toggleFilter={toggleFilter}
					onDatePress={() => setShowDatePicker(true)}
				/>
			)}

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
				) : directionsStatus === 'planning' ? (
					<RoutePlanningBar
						origin={routeOrigin}
						destination={destination}
						venues={dbVenues}
						hasCurrentLocation={currentCoord != null}
						recentLocations={recentLocations}
						onSelectOrigin={setRouteOrigin}
						onSelectDestination={setRouteDestination}
						onUseCurrentLocation={() => {
							if (currentCoord) {
								setRouteOrigin({ name: '현재 위치', coord: currentCoord });
							}
						}}
						onFocusLocation={(coord) =>
							mapRef.current?.animateCameraTo({ ...coord, zoom: 14 })
						}
						onAddRecent={addRecent}
						onSwap={swapEndpoints}
						onConfirm={handleConfirmRoutePlan}
						onClose={handleCloseRoute}
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
			{directionsStatus === 'idle' &&
				searchText.length > 0 &&
				mapVenues.length === 0 && (
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
						onRequestDirections={handleBeginDirections}
					/>
				)}
			</BottomSheetModal>

			{/* 길찾기 패널을 다시 열 수 있는 버튼 — 패널을 드래그로 내려도(index -1) 항상 떠 있고,
			    아래의 BottomSheet가 나중에 그려지며(JSX 순서상 위 레이어) 패널이 열리면 이 버튼을 자연히 덮는다. */}
			{directionsStatus !== 'idle' && directionsStatus !== 'planning' && (
				<Pressable
					onPress={() => routeSheetRef.current?.snapToIndex(1)}
					className='absolute left-5 bottom-8 flex-row items-center gap-2 h-12 px-5 rounded-full bg-[rgba(15,14,13,0.92)] border border-white/15'
					accessibilityLabel='경로 패널 다시 보기'
					accessibilityRole='button'
				>
					<Ionicons name='navigate' size={16} color='white' />
					<Text className='text-white text-[13px] font-pretendard-bold'>
						경로 보기
					</Text>
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
				{directionsStatus !== 'idle' && directionsStatus !== 'planning' && (
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
						originName={routeOrigin?.name}
						bottomInset={insets.bottom}
					/>
				)}
			</BottomSheet>
		</View>
	);
}
