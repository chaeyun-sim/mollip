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
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePickerModal } from '@/src/components/common/DatePickerModal';
import { FilterChips } from '@/src/components/map/FilterChips';
import { MapBottomControls } from '@/src/components/map/MapBottomControls';
import { MapTopBar } from '@/src/components/map/MapTopBar';
import { RouteSheet } from '@/src/components/map/RouteSheet';
import { VenueMarker } from '@/src/components/map/VenueMarker';
import { VenueSheet } from '@/src/components/map/VenueSheet';
import { ZoomControls } from '@/src/components/map/ZoomControls';
import { venueGroups } from '@/src/data/venues';
import { useDirections, type DirectionsMode } from '@/src/hooks/useDirections';
import { useMapCamera, DEFAULT_CAMERA } from '@/src/hooks/useMapCamera';
import { useMapFilter } from '@/src/hooks/useMapFilter';
import { useMapMarkers } from '@/src/hooks/useMapMarkers';
import { useMapVenues } from '@/src/hooks/useMapVenues';
import { useRecentLocations } from '@/src/hooks/useRecentLocations';
import { useVenueExhibitions } from '@/src/hooks/useVenueExhibitions';
import { useMapStore } from '@/src/store/mapStore';
import { distanceKm, formatDistance, latOffsetForPixels } from '@/src/utils/mapUtils';
import { legColor } from '@/src/utils/routeColors';
import type { RouteCoord, RouteLeg } from '@/src/api/tmap';
import { colors } from '@/src/constants/colors';
import { Screen } from '@/src/components/layout/Screen';

// 도보만 지도에서 진한 잉크색으로 강조 — 버스/지하철은 legColor(지하철은 호선별)를 그대로 쓴다.
function pathColor(leg: RouteLeg): string {
	return leg.mode === 'walk' ? colors.primary : legColor(leg);
}

const MARKER_ZOOM = 14;

export default function MapScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height: screenHeight } = useWindowDimensions();
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const routeSheetRef = useRef<BottomSheet>(null);
	// 경로 시트 snap index 추적 — 카메라 세로 중심 보정용
	const routeSheetIndexRef = useRef(-1);
	// 전시 상세로 이동하기 위해 프로그램적으로 시트를 닫을 때는 선택 상태를 지우지 않도록 하는 플래그.
	const suppressClearOnDismissRef = useRef(false);
	// 바텀시트 현재 index — onChange 콜백 기반 상태 추적
	const venueSheetIndexRef = useRef(-1);
	// present() 호출 후 onChange 완료까지 true — double-present 방지용
	const sheetPresentingRef = useRef(false);

	const { mapRef, cameraRef, currentCoord, displayZoom, handleCameraChanged } =
		useMapCamera();

	const {
		selectedVenueName,
		selectVenue,
		clearSelection,
		pendingCamera,
		clearPendingCamera,
	} = useMapStore();
	// 전시 상세에서 지도로 진입했는지 추적 — currentCoord 자동 포커스를 막기 위해 사용
	const cameFromExhibitionRef = useRef(false);
	// 현재 위치 첫 포커스 여부 — GPS 갱신마다 카메라가 튀는 걸 막기 위해 사용
	const hasInitialCameraRef = useRef(false);
	// 직전 displayZoom — MARKER_ZOOM 임계값 교차 감지용
	const prevDisplayZoomRef = useRef(displayZoom);
	// venue 바텀시트가 현재 열려있는지 — 핀이 선택된 채 시트만 닫혔을 때 재오픈 버튼을 표시하기 위해
	const [isVenueSheetOpen, setIsVenueSheetOpen] = useState(false);
	const [filterDate, setFilterDate] = useState(new Date());
	// 줌 임계값 교차 시 마커 전환 인디케이터 표시 여부
	const [isZoomTransitioning, setIsZoomTransitioning] = useState(false);
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
	const { pinnedVenueName, fullMarkerVenues, dotVenues } = useMapMarkers({
		mapVenues,
		dbVenues,
		selectedVenueName,
		displayZoom,
		filterDate,
		directionsStatus,
		routeOriginName: routeOrigin?.name,
		destinationName: destination?.name,
	});

	const selectedVenue = useMemo(() => {
		if (!selectedVenueName) return null;
		const allVenues = [...venueGroups, ...dbVenues];
		// 직접 매칭
		const direct = allVenues.find((v) => v.venueName === selectedVenueName);
		if (direct) return direct;
		// 하위 미술관 이름으로 부모 venue 찾기 — exhibition.venue가 sub-venue 이름일 때 대응
		return (
			allVenues.find((v) =>
				v.subVenues?.some((sv) => sv.venueName === selectedVenueName),
			) ?? null
		);
	}, [selectedVenueName, dbVenues]);

	// present() 중복 호출 방지 — 애니메이션 중(onChange 미발화)에도 중복 차단
	const openVenueSheet = useCallback(() => {
		if (sheetPresentingRef.current || venueSheetIndexRef.current !== -1) return;
		sheetPresentingRef.current = true;
		bottomSheetRef.current?.present();
	}, []);

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

	// 검색 결과 1개일 때 카메라 자동 이동 — 길찾기 진행 중에는 카메라를 뺏지 않는다
	useEffect(() => {
		if (directionsStatus !== 'idle') return;
		if (mapVenues.length === 1) {
			const v = mapVenues[0];
			const offset = latOffsetForPixels(MARKER_ZOOM, -25);
			mapRef.current?.animateCameraTo({
				latitude: v.coordinates.latitude + offset,
				longitude: v.coordinates.longitude,
				zoom: MARKER_ZOOM,
			});
		}
	}, [mapVenues, mapRef, directionsStatus]);

	// routeSheet snap 비율 → 카메라 세로 오프셋(px) 계산
	// 시트 열림: 타겟을 스크린 1/4 지점에 고정 (카메라 중심을 1/4만큼 아래로 이동)
	// 시트 닫힘: 오프셋 없음 (스크린 중앙)
	const routeSnapFractions = [0.24, 0.5, 0.85] as const;
	const routeCameraOffsetPx = useCallback((): number => {
		return routeSheetIndexRef.current >= 0 ? -(screenHeight * 0.25) : 0;
	}, [screenHeight]);

	// 경로 조회에 성공하면 경로 전체가 시트 위의 맵 영역 중앙에 오도록 카메라를 맞춘다.
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

		const latRange = maxLat - minLat;
		const lonRange = maxLon - minLon;
		const latPad = latRange * 0.1 || 0.001;
		const lonPad = lonRange * 0.1 || 0.001;

		// 시트가 화면의 sheetFrac만큼 올라와 있으면, 남은 맵 영역(1-sheetFrac)에
		// 경로가 들어가야 하므로 남쪽 경계를 sheetFrac / (1 - sheetFrac) 비율만큼 더 내린다.
		const idx = routeSheetIndexRef.current;
		const sheetFrac = idx >= 0 ? (routeSnapFractions[idx] ?? 0.5) : 0;
		const bottomBias =
			sheetFrac > 0 ? (latRange + 2 * latPad) * (sheetFrac / (1 - sheetFrac)) : 0;

		mapRef.current?.animateCameraWithTwoCoords({
			coord1: {
				latitude: minLat - latPad - bottomBias,
				longitude: minLon - lonPad,
			},
			coord2: { latitude: maxLat + latPad, longitude: maxLon + lonPad },
		});
	}, [route, directionsStatus, mapRef, routeCameraOffsetPx]);

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
			// 네비게이션을 먼저 시작하고 시트를 닫아 빈 지도가 잠깐 보이는 현상을 방지한다.
			suppressClearOnDismissRef.current = true;
			router.push(`/(explore)/${exhibitionId}`);
			bottomSheetRef.current?.dismiss();
		},
		[router],
	);

	// 시트를 열어야 함을 기록 — displayVenue가 준비되면 openVenueSheet() 호출
	const wantToOpenRef = useRef(false);

	// displayVenue 준비 완료 시 시트 오픈 (빈 sheet present → content 마운트 시 dismiss 버그 방지)
	useEffect(() => {
		if (!wantToOpenRef.current) return;
		if (!selectedVenueName || !displayVenue || directionsStatus !== 'idle')
			return;
		openVenueSheet();
		wantToOpenRef.current = false;
	}, [displayVenue, selectedVenueName, directionsStatus, openVenueSheet]);

	// suppressClearOnDismissRef 리셋 — 전시 상세에서 뒤로가기 시 dismiss가 소비되지 않아 ref가 남는 경우 방지
	useFocusEffect(
		useCallback(() => {
			suppressClearOnDismissRef.current = false;
		}, []),
	);

	// 전시 상세에서 지도 탭으로 진입 시 해당 위치로 카메라 이동
	useFocusEffect(
		useCallback(() => {
			if (!pendingCamera) return;
			cameFromExhibitionRef.current = true;
			const offset = latOffsetForPixels(MARKER_ZOOM, -25);
			mapRef.current?.animateCameraTo({
				latitude: pendingCamera.latitude + offset,
				longitude: pendingCamera.longitude,
				zoom: MARKER_ZOOM,
			});
			selectVenue(pendingCamera.venueName);
			wantToOpenRef.current = true;
			clearPendingCamera();
		}, [pendingCamera, mapRef, selectVenue, clearPendingCamera]),
	);

	// 상세 화면에서 뒤로가기로 지도 탭에 돌아왔을 때, 선택이 남아있으면 시트를 다시 연다.
	useFocusEffect(
		useCallback(() => {
			if (!selectedVenueName || directionsStatus !== 'idle') return;
			if (displayVenue) {
				openVenueSheet();
			} else {
				wantToOpenRef.current = true;
			}
		}, [selectedVenueName, directionsStatus, displayVenue, openVenueSheet]),
	);

	// 첫 진입 시 현재 위치로 카메라 이동 — GPS 갱신마다 반복하지 않도록 한 번만 실행
	useEffect(() => {
		if (!currentCoord) return;
		if (cameFromExhibitionRef.current) return;
		if (hasInitialCameraRef.current) return;
		hasInitialCameraRef.current = true;
		mapRef.current?.animateCameraTo({ ...currentCoord, zoom: 12 });
	}, [currentCoord, mapRef]);

	// 줌 레벨이 MARKER_ZOOM(14) 임계값을 교차할 때 짧은 전환 인디케이터 표시
	useEffect(() => {
		const prevZoom = prevDisplayZoomRef.current;
		prevDisplayZoomRef.current = displayZoom;
		const crossed =
			(prevZoom < MARKER_ZOOM && displayZoom >= MARKER_ZOOM) ||
			(prevZoom >= MARKER_ZOOM && displayZoom < MARKER_ZOOM);
		if (!crossed) return;
		setIsZoomTransitioning(true);
		const timer = setTimeout(() => setIsZoomTransitioning(false), 350);
		return () => clearTimeout(timer);
	}, [displayZoom]);

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
		<Screen variant='dark'>
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
						onTap={(v) => {
							if (directionsStatus !== 'idle') {
								// 경로 모드: dot 탭 시 해당 위치로 zoom
								mapRef.current?.animateCameraTo({
									latitude: v.coordinates.latitude,
									longitude: v.coordinates.longitude,
									zoom: MARKER_ZOOM,
								});
								return;
							}
							handleMarkerPress(
								v.venueName,
								v.coordinates.latitude,
								v.coordinates.longitude,
							);
						}}
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
							onTap={() => {
								// dot 탭 시 sheet 최소화 → 지도 영역 최대 확보, 오프셋 없이 스크린 중앙
								routeSheetRef.current?.snapToIndex(0);
								mapRef.current?.animateCameraTo({
									latitude: point.latitude,
									longitude: point.longitude,
									zoom: MARKER_ZOOM,
								});
							}}
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

			{/* 줌 임계값(MARKER_ZOOM) 교차 시 마커 전환 인디케이터 */}
			{isZoomTransitioning && (
				<View
					className='absolute inset-0 items-center justify-center'
					pointerEvents='none'
					style={{ zIndex: 5 }}
				>
					<ActivityIndicator size='small' color='rgba(0,0,0,0.4)' />
				</View>
			)}

			{/* 필터 칩 — 길찾기·출발/도착 설정 중이면 숨긴다 */}
			{directionsStatus === 'idle' && (
				<FilterChips
					topOffset={insets.top + 56}
					filterDate={filterDate}
					activeFilters={activeFilters}
					toggleFilter={toggleFilter}
					onDatePress={() => setShowDatePicker(true)}
				/>
			)}

			<MapTopBar
				insetsTop={insets.top}
				directionsStatus={directionsStatus}
				searchText={searchText}
				onChangeSearchText={setSearchText}
				mapVenues={mapVenues}
				onMarkerPress={handleMarkerPress}
				routeOrigin={routeOrigin}
				destination={destination}
				dbVenues={dbVenues}
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

			<MapBottomControls
				onLocate={handleLocate}
				selectedVenueName={selectedVenueName}
				isVenueSheetOpen={isVenueSheetOpen}
				directionsStatus={directionsStatus}
				onOpenVenueSheet={openVenueSheet}
				routeSheetRef={routeSheetRef}
			/>

			{/* 바텀시트 — 장소 정보 (길찾기 모드에서는 닫혀 있고, 하단 경로 패널이 대신 보인다) */}
			<BottomSheetModal
				ref={bottomSheetRef}
				index={1}
				snapPoints={snapPoints}
				enableDynamicSizing={false}
				onChange={(index) => {
					venueSheetIndexRef.current = index;
					sheetPresentingRef.current = false;
					setIsVenueSheetOpen(index !== -1);
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
				{displayVenue ? (
					<VenueSheet
						venue={displayVenue}
						filterDate={filterDate}
						distanceText={distanceText}
						onGoToExhibition={handleGoToExhibition}
						onRequestDirections={handleBeginDirections}
					/>
				) : isVenueSheetOpen ? (
					<View className='flex-1 items-center justify-center py-12'>
						<ActivityIndicator color={colors.tertiary} />
					</View>
				) : null}
			</BottomSheetModal>

			{/* 길찾기 패널 — 모달이 아닌 BottomSheet라 지도를 자유롭게 탭/이동해도 닫히지 않고,
			    손잡이로 드래그해서 접고 펼 수 있다. 재오픈 버튼보다 뒤에 그려서 패널이 열렸을 때 버튼을 덮는다. */}
			<BottomSheet
				ref={routeSheetRef}
				index={-1}
				snapPoints={routeSnapPoints}
				enableDynamicSizing={false}
				enablePanDownToClose
				onChange={(index) => {
					routeSheetIndexRef.current = index;
				}}
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
		</Screen>
	);
}
