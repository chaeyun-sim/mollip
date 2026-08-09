import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';

export default function ArtworksBookmarkScreen() {
	const router = useRouter();

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Back color='#78716C' />
				<Screen.Header.Center>
					<Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 16, color: '#1C1917' }}>
						좋아요한 그림
					</Text>
				</Screen.Header.Center>
			</Screen.Header>

			<View className='flex-1 items-center justify-center gap-4'>
				<Ionicons name='heart-outline' size={36} color='#D6D3D1' />
				<Text className='text-[#A8A29E] text-[14px] font-pretendard-regular text-center'>
					아직 좋아요한 그림이 없어요{'\n'}전시를 감상하며 마음에 드는 작품을 저장해보세요
				</Text>
				<Pressable
					onPress={() => router.push('/(tabs)')}
					accessibilityRole='button'
					accessibilityLabel='전시 둘러보기'
					className='mt-2 px-5 py-3 rounded-full bg-[#1C1917]'
					style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
				>
					<Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 14, color: '#F8F6F2' }}>
						전시 둘러보기
					</Text>
				</Pressable>
			</View>
		</Screen>
	);
}
