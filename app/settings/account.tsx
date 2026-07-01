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
					<Text
						className='text-base text-white'
						style={{ fontFamily: 'Pretendard-SemiBold' }}
					>
						계정 정보
					</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right />
			</ScreenHeader>

			<View className='flex-1 items-center justify-center'>
				<Text
					style={{ fontFamily: 'Pretendard-Regular', color: '#555', fontSize: 15 }}
				>
					준비 중이에요
				</Text>
			</View>
		</Screen>
	);
}
