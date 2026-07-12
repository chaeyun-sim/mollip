import { View, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

interface WashiTapeProps {
	width?: number;
	color?: string;
	stripeColor?: string;
	rotate?: number;
	style?: ViewStyle;
}

// 반투명 마스킹테이프 조각. style로 absolute 위치를 지정해 종이 위에 붙인다.
export function WashiTape({
	width = 88,
	color = 'rgba(180, 205, 222, 0.55)',
	stripeColor = 'rgba(255, 255, 255, 0.5)',
	rotate = -4,
	style,
}: WashiTapeProps) {
	const height = 26;
	return (
		<View
			className='overflow-hidden'
			style={[
				{
					width,
					height,
					backgroundColor: color,
					transform: [{ rotate: `${rotate}deg` }],
					shadowColor: '#000',
					shadowOpacity: 0.08,
					shadowRadius: 2,
					shadowOffset: { width: 0, height: 1 },
				},
				style,
			]}
			pointerEvents='none'
		>
			<Svg width={width} height={height}>
				{Array.from({ length: Math.ceil(width / 12) + 2 }, (_, i) => (
					<Line
						key={i}
						x1={i * 12 - height}
						y1={height}
						x2={i * 12}
						y2={0}
						stroke={stripeColor}
						strokeWidth={4}
					/>
				))}
			</Svg>
		</View>
	);
}
