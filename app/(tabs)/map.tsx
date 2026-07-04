import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
	return (
		<SafeAreaView className='flex-1 bg-white' edges={['top']}>
			<View className='flex-1 items-center justify-center gap-3'>
				<Ionicons name='map' size={48} color='#9CA3AF' />
				<Text className='text-gray-900 text-lg font-pretendard-bold'>지도</Text>
				<Text className='text-gray-400 text-[13px] font-pretendard-regular'>Coming soon</Text>
			</View>
		</SafeAreaView>
	);
}
