import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';
import { colors } from '@/src/constants/colors';

const SCULPTURE = require('@/assets/images/skulpture/default.png');

export function ExploreHomeHero() {
	return (
		<View>
			<LinearGradient
				colors={['#E8E0F4', '#F5F0EB', colors.bgLight]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{
					borderRadius: 28,
					paddingHorizontal: 22,
					paddingTop: 24,
					paddingBottom: 24,
					overflow: 'hidden',
				}}
			>
				<View
					pointerEvents='none'
					className='absolute -top-10 -right-10 w-40 h-40 rounded-[80px] bg-[#ffffff45]'
				/>

				<Text className='text-[11px] text-tertiary mb-3 font-pretendard-semibold leading-[2.4px]'>
					ABSORBED IN ART
				</Text>

				<View className='flex-row items-end justify-between'>
					<View className='flex-1 pr-3'>
						<Text className='text-primary text-[34px] leading-[40px] font-hahmlet-bold'>
							{'어떤 이야기를\n담고 있을까요?'}
						</Text>
						<Text className='text-[14px] text-secondary mt-3 leading-[21px] font-pretendard-regular'>
							전시를 발견하고, 몰입하고, 기록까지.
						</Text>
					</View>
					<Image
						source={SCULPTURE}
						resizeMode='contain'
						style={{ width: 72, height: 100, marginBottom: -4 }}
						accessibilityIgnoresInvertColors
					/>
				</View>
			</LinearGradient>
		</View>
	);
}
