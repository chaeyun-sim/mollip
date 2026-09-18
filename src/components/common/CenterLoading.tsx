import { View } from 'react-native';
import { Indicator } from './Indicator';

export function CenterLoading() {
	return (
		<View className="flex-1 items-center justify-center">
			<Indicator color="gray600" />
		</View>
	);
}
