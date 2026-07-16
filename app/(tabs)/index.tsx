import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { SERVICE_NAME } from '@/src/constants/service-name';

const NEARBY_EXHIBITIONS = [
	{
		id: '1',
		name: '모네, 빛을 그리다',
		venue: '예술의전당',
		distance: '0.4km',
		endDate: '2026.08.31',
		color: '#E8D5B7',
	},
	{
		id: '2',
		name: '이중섭 특별전',
		venue: '국립현대미술관',
		distance: '1.2km',
		endDate: '2026.07.20',
		color: '#D5E8D4',
	},
	{
		id: '3',
		name: '달리 초현실주의',
		venue: '세종문화회관',
		distance: '2.1km',
		endDate: '2026.09.15',
		color: '#D4D5E8',
	},
];

const FEATURED_EXHIBITIONS = [
	{
		id: '4',
		name: '김환기 회고전',
		venue: '환기미술관',
		dates: '2026.05.01 – 2026.09.30',
		tag: '현재 전시 중',
		color: '#D4C5B0',
	},
	{
		id: '5',
		name: 'KAWS: HOLIDAY',
		venue: '롯데뮤지엄',
		dates: '2026.06.15 – 2026.10.01',
		tag: '이번 주 마감',
		color: '#B8CCB8',
	},
	{
		id: '6',
		name: '반 고흐: 별이 빛나는 밤',
		venue: 'DDP 갤러리',
		dates: '2026.04.01 – 2026.08.15',
		tag: '인기',
		color: '#C8C5D8',
	},
];

export default function ExploreScreen() {
	const router = useRouter();

	return (
		<Screen className='bg-white'>
			<StatusBar style='dark' />

			<Screen.Header>
				<Screen.Header.Left>
					<Text className='text-gray-900 text-[22px] font-pretendard-bold'>{SERVICE_NAME}</Text>
				</Screen.Header.Left>
				<Screen.Header.Right>
					<Pressable
						onPress={() => router.push('/settings')}
						hitSlop={12}
						accessibilityLabel='설정'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons name='settings-outline' size={22} color='#9CA3AF' />
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 48 }}
			>
				{/* 타이틀 */}
				<View className='gap-1.5 mb-5'>
					<View className='flex-row items-center gap-1'>
						<Ionicons name='location-outline' size={13} color='#9CA3AF' />
						<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
							서울·종로구
						</Text>
					</View>
					<View className='flex-row items-end justify-between'>
						<Text className='mt-2 text-gray-900 text-[38px] leading-[42px] font-hahmlet-bold'>
							{'어떤 이야기를\n담고 있을까요?'}
						</Text>
						{/* 석고상 도슨트 캐릭터 */}
						<Image
							source={require('../../assets/images/skulpture/default.png')}
							resizeMode='contain'
							style={{ width: 50, height: 70, marginBottom: -6 }}
						/>
					</View>
				</View>

				{/* 이번 주 전시 — 큰 카드 */}
				<View>
					<View className='gap-4'>
						{FEATURED_EXHIBITIONS.map((item) => (
							<Pressable
								key={item.id}
								onPress={() => router.push(`/(explore)/${item.id}`)}
								accessibilityLabel={`${item.name}, ${item.venue}`}
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
							>
								{/* 포스터 이미지 영역 */}
								<View
									className='w-full aspect-[3/4] rounded-lg overflow-hidden relative'
									style={{ backgroundColor: item.color }}
								>
									{/* 하단 오버레이 + 텍스트 */}
									<View className='absolute bottom-0 left-0 right-0 px-4 pb-5 pt-10'>
										<View className='relative gap-0.5'>
											<Text className='text-white text-xl font-pretendard-bold'>
												{item.name}
											</Text>
											<Text className='text-white/70 text-[13px] font-pretendard-semibold'>
												{item.venue} · {item.dates}
											</Text>
										</View>
									</View>
								</View>
							</Pressable>
						))}
					</View>
				</View>
			</ScrollView>

			{/* 해설 생성 FAB */}
			<Pressable
				onPress={() => router.push('/create-description')}
				accessibilityLabel='작품 해설 만들기'
				accessibilityRole='button'
				className='absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#1C1917]'
				style={({ pressed }) => ({
					opacity: pressed ? 0.8 : 1,
					shadowColor: '#000',
					shadowOpacity: 0.3,
					shadowRadius: 8,
					shadowOffset: { width: 0, height: 4 },
					elevation: 6,
				})}
			>
				<Ionicons name='camera' size={24} color='#E5D5B5' />
			</Pressable>
		</Screen>
	);
}
