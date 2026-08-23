import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { View } from 'react-native';
import type { FilterKey } from '@/src/hooks/useMapFilter';
import type { VenueGroup } from '@/src/data/venues';

// 잉크 원형 배지 + 석고상 합성 이미지 (마커 children은 스냅샷 방식이라 완성 PNG 사용)
const MARKER_IMAGE = require('../../../assets/images/skulpture/marker-badge.png');

interface VenueMarkerProps {
	venue: VenueGroup;
	// 'full' | 'dot' 여부는 상위(declutterMarkers)에서 밀집도 기준으로 이미 정해서 내려준다.
	// 이 컴포넌트는 좌표를 옮기지 않고 크기/라벨 유무만 다르게 그린다.
	variant: 'full' | 'dot';
	isSelected: boolean;
	activeFilters: Set<FilterKey>;
	matchesFilters: (v: VenueGroup) => boolean;
	onTap: (venue: VenueGroup) => void;
}

export function VenueMarker({
	venue,
	variant,
	isSelected,
	activeFilters,
	matchesFilters,
	onTap,
}: VenueMarkerProps) {
	const dimmed = activeFilters.size > 0 && !matchesFilters(venue);

	if (variant === 'dot') {
		const size = 10;
		return (
			<NaverMapMarkerOverlay
				latitude={venue.coordinates.latitude}
				longitude={venue.coordinates.longitude}
				onTap={() => onTap(venue)}
				width={size}
				height={size}
				anchor={{ x: 0.5, y: 0.5 }}
				alpha={dimmed ? 0.25 : 0.85}
			>
				<View
					collapsable={false}
					className='bg-primary border border-white'
					style={{ width: size, height: size, borderRadius: size / 2 }}
				/>
			</NaverMapMarkerOverlay>
		);
	}

	const size = isSelected ? 48 : 36;
	return (
		<NaverMapMarkerOverlay
			latitude={venue.coordinates.latitude}
			longitude={venue.coordinates.longitude}
			onTap={() => onTap(venue)}
			width={size}
			height={size}
			anchor={{ x: 0.5, y: 0.5 }}
			image={MARKER_IMAGE}
			alpha={dimmed ? 0.2 : 1}
		/>
	);
}
