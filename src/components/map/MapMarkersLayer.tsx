import {
	NaverMapMarkerOverlay,
	NaverMapPathOverlay,
	type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import type BottomSheet from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import { View } from 'react-native';

import { VenueMarker } from '@/src/components/map/VenueMarker';
import type { DirectionsStatus } from '@/src/hooks/useDirections';
import type { FilterKey } from '@/src/hooks/useMapFilter';
import type { VenueGroup } from '@/src/data/venues';
import { legColor } from '@/src/utils/routeColors';
import { colors } from '@/src/constants/colors';
import type { RouteLeg, RouteResult } from '@/src/api/tmap';

const MARKER_ZOOM = 14;

// 도보만 지도에서 진한 잉크색으로 강조 — 버스/지하철은 legColor(지하철은 호선별)를 그대로 쓴다.
function pathColor(leg: RouteLeg): string {
	return leg.mode === 'walk' ? colors.primary : legColor(leg);
}

interface MapMarkersLayerProps {
	dotVenues: VenueGroup[];
	fullMarkerVenues: VenueGroup[];
	selectedVenueName: string | null;
	activeFilters: Set<FilterKey>;
	matchesFilters: (venue: VenueGroup) => boolean;
	directionsStatus: DirectionsStatus;
	route: RouteResult | null;
	mapRef: RefObject<NaverMapViewRef | null>;
	routeSheetRef: RefObject<BottomSheet | null>;
	onMarkerPress: (venueName: string, lat: number, lon: number) => void;
}

/** NaverMapView 안에 그려지는 마커·경로선·환승 지점. 지도 카메라 조작 없이 순수 렌더링만 담당한다. */
export function MapMarkersLayer({
	dotVenues,
	fullMarkerVenues,
	selectedVenueName,
	activeFilters,
	matchesFilters,
	directionsStatus,
	route,
	mapRef,
	routeSheetRef,
	onMarkerPress,
}: MapMarkersLayerProps) {
	return (
		<>
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
						onMarkerPress(v.venueName, v.coordinates.latitude, v.coordinates.longitude);
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
					onTap={(v) => onMarkerPress(v.venueName, v.coordinates.latitude, v.coordinates.longitude)}
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
		</>
	);
}
