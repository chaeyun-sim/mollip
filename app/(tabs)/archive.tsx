import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArchiveScreen() {
	return (
		<SafeAreaView className='flex-1 bg-white' edges={['top']}>
			<View className='flex-1 items-center justify-center gap-3'>
				<Ionicons name='bookmark' size={48} color='#9CA3AF' />
				<Text className='font-pretendard-bold text-lg text-gray-900'>아카이브</Text>
				<Text className='text-sm text-gray-400'>저장된 작품이 없어요</Text>
			</View>
		</SafeAreaView>
	);
}
