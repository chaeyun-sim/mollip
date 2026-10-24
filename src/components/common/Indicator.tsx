import { colors } from '@/src/constants/colors';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

interface IndicatorProps extends ActivityIndicatorProps {
	color?: keyof typeof colors | string;
}

export function Indicator({ color = 'gray500', ...rest }: IndicatorProps) {
	const resolvedColor = color in colors ? colors[color as keyof typeof colors] : color;
	return <ActivityIndicator color={resolvedColor} {...rest} />;
}
