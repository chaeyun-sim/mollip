import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';

export default function AccountScreen() {
	const router = useRouter();

	return (
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Left>
					<ScreenHeader.Back onPress={() => router.back()} />
				</ScreenHeader.Left>
				<ScreenHeader.Center>
					<Text className='text-base text-white font-pretendard-semibold'>
						계정 정보
					</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right />
			</ScreenHeader>

			<View className='flex-1 items-center justify-center'>
				<Text className='font-pretendard-regular text-[#555] text-[15px]'>
					준비 중이에요
				</Text>
			</View>
		</Screen>
	);
}
