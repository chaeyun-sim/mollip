import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';

export default function AccountScreen() {
	const router = useRouter();

	return (
		<Screen className='bg-white'>
			<StatusBar style='dark' />

			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back color='#1C1917' onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>
					<Text className='text-[16px] text-gray-900 font-pretendard-semibold'>
						계정 정보
					</Text>
				</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>

			<View className='flex-1 items-center justify-center'>
				<Text className='font-pretendard-regular text-gray-400 text-[15px]'>
					준비 중이에요
				</Text>
			</View>
		</Screen>
	);
}
