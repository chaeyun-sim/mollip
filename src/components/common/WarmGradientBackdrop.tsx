import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { colors } from '@/src/constants/colors';

/** 온보딩·취향 화면 배경에 쓰는 웜톤 그라디언트. 화면 전체를 절대 위치로 덮는다. */
export function WarmGradientBackdrop() {
	return (
		<LinearGradient
			colors={['#FFF3E6', '#F7DFCE', '#E4CCE8', colors.bgLight]}
			locations={[0, 0.32, 0.68, 1]}
			style={StyleSheet.absoluteFill}
		/>
	);
}
