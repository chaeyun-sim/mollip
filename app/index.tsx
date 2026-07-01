import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../src/components/layout/Screen';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';

export default function IndexScreen() {
	const router = useRouter();

	return (
		<Screen className='bg-white'>
			{/* 헤더 */}
			<ScreenHeader>
				<ScreenHeader.Right>
					<TouchableOpacity
						onPress={() => router.push('/settings')}
						hitSlop={12}
						accessibilityLabel='설정'
						accessibilityRole='button'
					>
						<Ionicons name='settings-outline' size={22} color='#A8A29E' />
					</TouchableOpacity>
				</ScreenHeader.Right>
			</ScreenHeader>

			{/* 본문 */}
			<View className='flex-1 justify-between pb-10'>
				<View>{/* TODO: 여기 뭐 넣을지 고민중 skip */}</View>

				{/* 하단 CTA 버튼 */}
				<Pressable
					className='w-full rounded-3xl overflow-hidden'
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						router.push('/create-description');
					}}
					style={({ pressed }) => ({
						transform: [{ scale: pressed ? 0.97 : 1 }],
					})}
					accessibilityLabel='해설 들으러 가기'
					accessibilityRole='button'
				>
					<View
						className='flex-row items-center justify-between px-7 py-6'
						style={{ backgroundColor: '#3B82F6' }}
					>
						<View className='gap-1'>
							<Text
								className='text-white text-xl'
								style={{ fontFamily: 'Pretendard-Bold' }}
							>
								해설 들으러 가기
							</Text>
							<Text
								className='text-xs'
								style={{
									fontFamily: 'Pretendard-Regular',
									color: 'rgba(255,255,255,0.6)',
								}}
							>
								카메라 · 갤러리 · 직접 입력
							</Text>
						</View>
						<View className='w-12 h-12 rounded-2xl items-center justify-center bg-white/20'>
							<Ionicons name='headset' size={24} color='#fff' />
						</View>
					</View>
				</Pressable>
			</View>
		</Screen>
	);
}
