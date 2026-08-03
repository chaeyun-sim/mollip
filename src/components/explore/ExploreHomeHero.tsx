import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';

const SCULPTURE = require('@/assets/images/skulpture/default.png');

export function ExploreHomeHero() {
	return (
		<View>
			<LinearGradient
				colors={['#E8E0F4', '#F5F0EB', '#F8F6F2']}
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
					style={{
						position: 'absolute',
						top: -40,
						right: -30,
						width: 160,
						height: 160,
						borderRadius: 80,
						backgroundColor: 'rgba(255,255,255,0.45)',
					}}
				/>

				<Text
					className='text-[11px] text-[#78716C] mb-3'
					style={{ fontFamily: 'Pretendard-SemiBold', letterSpacing: 2.4 }}
				>
					ABSORBED IN ART
				</Text>

				<View className='flex-row items-end justify-between'>
					<View className='flex-1 pr-3'>
						<Text
							className='text-[#1C1917] text-[34px] leading-[40px]'
							style={{ fontFamily: 'Hahmlet_700Bold' }}
						>
							{'어떤 이야기를\n담고 있을까요?'}
						</Text>
						<Text
							className='text-[14px] text-[#57534E] mt-3 leading-[21px]'
							style={{ fontFamily: 'Pretendard-Regular' }}
						>
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
