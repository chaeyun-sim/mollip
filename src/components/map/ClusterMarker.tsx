import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { View } from 'react-native';
import type { FilterKey } from '@/src/hooks/useMapFilter';
import type { VenueGroup } from '@/src/data/venues';
import type { Cluster } from '@/src/utils/mapUtils';

const MARKER_IMAGE = require('../../../assets/images/marker/pearl-girl.png');
const MARKER_W = 43;
const MARKER_H = 44;

interface ClusterMarkerProps {
	cluster: Cluster;
	selectedVenueName: string | null;
	activeFilters: Set<FilterKey>;
	matchesFilters: (v: VenueGroup) => boolean;
	onTap: (cluster: Cluster) => void;
}

export function ClusterMarker({
	cluster,
	selectedVenueName,
	activeFilters,
	matchesFilters,
	onTap,
}: ClusterMarkerProps) {
	const isMulti = cluster.venues.length > 1;
	const isSelected =
		!isMulti && cluster.venues[0].venueName === selectedVenueName;
	const dimmed =
		activeFilters.size > 0 && cluster.venues.every((v) => !matchesFilters(v));
	const clusterKey = cluster.venues.map((v) => v.venueName).join('|');

	if (isMulti) {
		const size = 36;
		return (
			<NaverMapMarkerOverlay
				latitude={cluster.latitude}
				longitude={cluster.longitude}
				onTap={() => onTap(cluster)}
				width={size}
				height={size}
				anchor={{ x: 0.5, y: 0.5 }}
				alpha={dimmed ? 0.2 : 1}
				caption={{
					text: String(cluster.venues.length),
					align: 'Center',
					color: 'white',
					textSize: 13,
					haloColor: 'transparent',
				}}
			>
				<View
					key={`${clusterKey}-${cluster.venues.length}`}
					collapsable={false}
					className='bg-[#1D4ED8] border-2 border-white'
					style={{
						width: size,
						height: size,
						borderRadius: size / 2,
					}}
				/>
			</NaverMapMarkerOverlay>
		);
	}

	const w = isSelected ? 54 : MARKER_W;
	const h = isSelected ? 55 : MARKER_H;
	return (
		<NaverMapMarkerOverlay
			latitude={cluster.latitude}
			longitude={cluster.longitude}
			onTap={() => onTap(cluster)}
			width={w}
			height={h}
			anchor={{ x: 0.5, y: 0.5 }}
			image={MARKER_IMAGE}
			alpha={dimmed ? 0.2 : 1}
		/>
	);
}
