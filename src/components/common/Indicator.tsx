import { colors } from '@/src/constants/colors';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

interface IndicatorProps extends ActivityIndicatorProps {
	color?: keyof typeof colors | string;
}

export function Indicator({ color = 'gray500', ...rest }: IndicatorProps) {
	return <ActivityIndicator color={typeof color === 'string' ? color : colors[color]} {...rest} />;
}
