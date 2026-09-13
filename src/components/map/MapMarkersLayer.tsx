import { NaverMapMarkerOverlay, NaverMapPathOverlay } from '@mj-studio/react-native-naver-map';
import { memo, useCallback } from 'react';
import { View } from 'react-native';
import type { FilterKey } from '@/src/hooks/useMapFilter';
import { mapPathColor } from '@/src/utils/routeColors';
import type { RouteCoord, RouteResult } from '@/src/api/tmap';
import type { VenueGroup } from '@/src/data/venues';

const MARKER_IMAGE = require('../../../assets/images/skulpture/marker-badge.png');

interface DotMarkerProps {
	venue: VenueGroup;
	size: number;
	dimmed: boolean;
	onPress: (venue: VenueGroup) => void;
}

/** 점(dot) 마커 — venue/size/dimmed가 그대로면 리렌더되지 않는다 (전체 마커 동시 리렌더 방지). */
const DotMarker = memo(function DotMarker({ venue, size, dimmed, onPress }: DotMarkerProps) {
	const handleTap = useCallback(() => onPress(venue), [onPress, venue]);

	return (
		<NaverMapMarkerOverlay
			latitude={venue.coordinates.latitude}
			longitude={venue.coordinates.longitude}
			onTap={handleTap}
			width={size}
			height={size}
			anchor={{ x: 0.5, y: 0.5 }}
			alpha={dimmed ? 0.25 : 0.85}
		>
			<View
				collapsable={false}
				className="bg-gray900 border border-white"
				style={{ width: size, height: size, borderRadius: size / 2 }}
			/>
		</NaverMapMarkerOverlay>
	);
});

interface FullMarkerProps {
	venue: VenueGroup;
	size: number;
	dimmed: boolean;
	onPress: (venueName: string, lat: number, lon: number) => void;
}

/** 큰(full) 마커 — venue/size/dimmed가 그대로면 리렌더되지 않는다. */
const FullMarker = memo(function FullMarker({ venue, size, dimmed, onPress }: FullMarkerProps) {
	const handleTap = useCallback(
		() => onPress(venue.venueName, venue.coordinates.latitude, venue.coordinates.longitude),
		[onPress, venue],
	);

	return (
		<NaverMapMarkerOverlay
			latitude={venue.coordinates.latitude}
			longitude={venue.coordinates.longitude}
			onTap={handleTap}
			width={size}
			height={size}
			anchor={{ x: 0.5, y: 1 }}
			image={MARKER_IMAGE}
			alpha={dimmed ? 0.2 : 1}
		/>
	);
});

interface MapMarkersLayerProps {
	dotVenues: VenueGroup[];
	fullMarkerVenues: VenueGroup[];
	selectedVenueName: string | null;
	activeFilters: Set<FilterKey>;
	matchesFilters: (venue: VenueGroup) => boolean;
	route: RouteResult | null;
	onDotPress: (venue: VenueGroup) => void;
	onMarkerPress: (venueName: string, lat: number, lon: number) => void;
	onTransferPress: (point: RouteCoord) => void;
}

/** NaverMapView 안에 그려지는 마커·경로선·환승 지점. 카메라·시트 조작은 하지 않는다. */
export function MapMarkersLayer({
	dotVenues,
	fullMarkerVenues,
	selectedVenueName,
	activeFilters,
	matchesFilters,
	route,
	onDotPress,
	onMarkerPress,
	onTransferPress,
}: MapMarkersLayerProps) {
	const dotSize = 10;
	const fullSize = (venue: VenueGroup) => (venue.venueName === selectedVenueName ? 48 : 36);
	const dimmed = (venue: VenueGroup) => activeFilters.size > 0 && !matchesFilters(venue);

	return (
		<>
			{/* 점(dot) 먼저, 큰 마커를 나중에 그려서 겹칠 때 큰 마커가 위로 오게 한다 */}
			{dotVenues.map((venue) => (
				<DotMarker
					key={venue.venueName}
					venue={venue}
					size={dotSize}
					dimmed={dimmed(venue)}
					onPress={onDotPress}
				/>
			))}
			{fullMarkerVenues.map((venue) => (
				<FullMarker
					key={venue.venueName}
					venue={venue}
					size={fullSize(venue)}
					dimmed={dimmed(venue)}
					onPress={onMarkerPress}
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
						color={mapPathColor(leg)}
						outlineWidth={1}
						outlineColor="white"
					/>
				);
			})}
			{/* 환승 지점 — 마지막 구간(목적지) 제외, 각 구간이 끝나는 지점에 표시 */}
			{route?.legs.slice(0, -1).map((leg, i) => {
				const point = leg.coords[leg.coords.length - 1];
				const nextLeg = route.legs[i + 1];
				if (!point || !nextLeg) return null;
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
						onTap={() => onTransferPress(point)}
					>
						<View
							collapsable={false}
							className="border border-white"
							style={{
								width: size,
								height: size,
								borderRadius: size / 2,
								backgroundColor: mapPathColor(nextLeg),
							}}
						/>
					</NaverMapMarkerOverlay>
				);
			})}
		</>
	);
}
