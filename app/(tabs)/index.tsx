import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
	ActivityIndicator,
	Image,
	ImageBackground,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import { SERVICE_NAME } from '@/src/constants/service-name';
import {
	useCultureExhibitions,
	type CultureExhibitionItem,
} from '@/src/hooks/useCultureExhibitions';
import { useImageAspectRatio } from '@/src/hooks/useImageAspectRatio';
import {
	useKcisaExhibitions,
	type KcisaExhibitionItem,
} from '@/src/hooks/useKcisaExhibitions';

interface ExhibitionPosterCardProps {
	item: CultureExhibitionItem;
	onPress: (id: string) => void;
}

function ExhibitionPosterCard({ item, onPress }: ExhibitionPosterCardProps) {
	const aspectRatio = useImageAspectRatio(item.thumbnail);

	return (
		<Pressable
			onPress={() => onPress(item.id)}
			accessibilityLabel={`${item.title}, ${item.venue}`}
			accessibilityRole='button'
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
		>
			{item.thumbnail ? (
				// 포스터 이미지 영역 — 실제 이미지 비율에 맞춰 카드 모양 조절
				// imageStyle에도 borderRadius를 줘야 내부 Image 레이어가 모서리를 안 덮음 (RN 이슈)
				<ImageBackground
					source={{ uri: item.thumbnail }}
					className='w-full rounded-lg overflow-hidden relative'
					style={{ aspectRatio, backgroundColor: '#E8E4DC' }}
					imageStyle={{ borderRadius: 8 }}
				/>
			) : (
				<EmptyImagePlaceholder
					className='w-full rounded-lg overflow-hidden items-center justify-center bg-[#dad4c8]'
					style={{ aspectRatio: 0.75 }}
					iconSize={120}
				/>
			)}
		</Pressable>
	);
}

interface KcisaExhibitionCardProps {
	item: KcisaExhibitionItem;
	onPress: (id: string) => void;
}

const KCISA_CARD_WIDTH = 140;
const KCISA_CARD_HEIGHT = Math.round((KCISA_CARD_WIDTH * 4) / 3);
// 세로 ScrollView 안에 중첩된 가로 ScrollView는 높이가 없으면 aspect-ratio 계산이
// 안정적이지 않아(RN 중첩 스크롤뷰 이슈), 고정 width/height를 명시적으로 준다.
export const KCISA_SECTION_HEIGHT = KCISA_CARD_HEIGHT + 56;

function KcisaExhibitionCard({ item, onPress }: KcisaExhibitionCardProps) {
	return (
		<Pressable
			onPress={() => onPress(item.id)}
			accessibilityLabel={`${item.title}, ${item.venue}`}
			accessibilityRole='button'
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, width: KCISA_CARD_WIDTH })}
		>
			<View
				className='rounded-lg overflow-hidden'
				style={{ width: KCISA_CARD_WIDTH, height: KCISA_CARD_HEIGHT }}
			>
				{item.thumbnail ? (
					<Image
						source={{ uri: item.thumbnail }}
						style={{ width: KCISA_CARD_WIDTH, height: KCISA_CARD_HEIGHT, borderRadius: 8 }}
						resizeMode='cover'
					/>
				) : (
					<EmptyImagePlaceholder
						className='items-center justify-center bg-[#ece9e1]'
						style={{ width: KCISA_CARD_WIDTH, height: KCISA_CARD_HEIGHT }}
						iconSize={64}
					/>
				)}
			</View>
			<Text
				numberOfLines={2}
				style={{ width: KCISA_CARD_WIDTH }}
				className='mt-2 text-gray-900 text-[13px] font-pretendard-semibold leading-[18px]'
			>
				{item.title}
			</Text>
			<Text
				numberOfLines={1}
				style={{ width: KCISA_CARD_WIDTH }}
				className='text-gray-400 text-[11px] font-pretendard-regular mt-0.5'
			>
				{item.venue}
			</Text>
		</Pressable>
	);
}

export default function ExploreScreen() {
	const router = useRouter();
	const { items, status, refetch } = useCultureExhibitions();
	const {
		items: kcisaItems,
		status: kcisaStatus,
		refetch: kcisaRefetch,
	} = useKcisaExhibitions();

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
				<View className='gap-1.5 mb-8'>
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

				{/* 국공립 기관 전시 */}
				<View>
					<Text className='text-gray-900 text-[18px] font-pretendard-bold mb-3'>
						국공립 기관 전시
					</Text>
					{kcisaStatus === 'loading' && kcisaItems.length === 0 ? (
						<View className='items-center justify-center py-8'>
							<ActivityIndicator color='#9CA3AF' />
						</View>
					) : kcisaStatus === 'error' ? (
						<View className='items-center justify-center py-8 gap-2'>
							<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
								전시 정보를 불러오지 못했어요
							</Text>
							<Pressable onPress={kcisaRefetch} accessibilityLabel='다시 시도' accessibilityRole='button'>
								<Text className='text-gray-900 text-[13px] font-pretendard-semibold'>다시 시도</Text>
							</Pressable>
						</View>
					) : (
						<View style={{ height: KCISA_SECTION_HEIGHT }}>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ flexDirection: 'row', gap: 12 }}
							>
								{kcisaItems.map((item) => (
									<KcisaExhibitionCard
										key={item.id}
										item={item}
										onPress={(id) => router.push(`/(explore)/${id}`)}
									/>
								))}
							</ScrollView>
						</View>
					)}
				</View>

				{/* 이번 주 전시 — 큰 카드 */}
				<View className='mt-10'>
					<Text className='text-gray-900 text-[18px] font-pretendard-bold mb-3'>
						추천 전시
					</Text>
					{status === 'loading' && items.length === 0 ? (
						<View className='items-center justify-center py-16'>
							<ActivityIndicator color='#9CA3AF' />
						</View>
					) : status === 'error' ? (
						<View className='items-center justify-center py-16 gap-2'>
							<Text className='text-gray-400 text-[13px] font-pretendard-regular'>
								전시 정보를 불러오지 못했어요
							</Text>
							<Pressable onPress={refetch} accessibilityLabel='다시 시도' accessibilityRole='button'>
								<Text className='text-gray-900 text-[13px] font-pretendard-semibold'>다시 시도</Text>
							</Pressable>
						</View>
					) : (
						<View className='gap-4'>
							{items.map((item) => (
								<ExhibitionPosterCard
									key={item.id}
									item={item}
									onPress={(id) => router.push(`/(explore)/${id}`)}
								/>
							))}
						</View>
					)}
				</View>
			</ScrollView>

			{/* 해설 생성 FAB */}
			<Pressable
				onPress={() => router.push('/(guide)/create-description')}
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
