import { StyleSheet, View } from 'react-native';

interface NearbyPlaceRowSkeletonProps {
	isFirst: boolean;
}

export function NearbyPlaceRowSkeleton({ isFirst }: NearbyPlaceRowSkeletonProps) {
	return (
		<View
			className='flex-row items-center gap-3 py-3 border-border'
			style={{ borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth }}
		>
			<View className='w-12 h-12 rounded-full bg-divider' />
			<View className='flex-1 gap-1.5'>
				<View className='h-3.5 w-2/3 rounded-full bg-divider' />
				<View className='h-3 w-1/2 rounded-full bg-divider' />
			</View>
		</View>
	);
}
