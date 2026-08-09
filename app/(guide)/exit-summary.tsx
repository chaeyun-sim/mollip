import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNearbyPlaces, type NearbyPlace } from '@/src/hooks/useNearbyPlaces';

const CATEGORY_LABEL: Record<NearbyPlace['category'], string> = {
	cafe: '카페',
	restaurant: '맛집',
};

const TEXT_SHADOW = {
	textShadowColor: 'rgba(0,0,0,0.6)',
	textShadowOffset: { width: 0, height: 1 },
	textShadowRadius: 6,
};

// 셀프 가이드를 종료할 때 보여주는 마무리 화면 — create-description의 종료 확인 후 진입.
// 여기서 "다른 전시 보러가기"를 눌러야 메인 서비스로 돌아간다 (create-description.tsx 참고).
// 다른 (guide) 화면들과 달리 흰 배경 — 종료의 산뜻한 느낌을 위해 의도적으로 다른 톤.
export default function ExitSummaryScreen() {
	const router = useRouter();

	const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
	useEffect(() => {
		Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
			.then((pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
			.catch(() => setLocation(null));
	}, []);

	const { data: places } = useNearbyPlaces(location);

	return (
		<SafeAreaView edges={['top', 'bottom']} className='flex-1 bg-[#F8F6F2] px-6'>
			<StatusBar style='dark' />
			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}
				showsVerticalScrollIndicator={false}
				scrollEnabled={false}
			>
				<View className='items-center mb-10'>
					<View className='w-16 h-16 rounded-full items-center justify-center mb-5 bg-[#F2EFE9]'>
						<Ionicons name='checkmark' size={28} color='#3B82F6' />
					</View>
					<Text className='text-[#1C1917] font-pretendard-bold text-[22px] text-center mb-2'>
						오디오 가이드를 종료합니다
					</Text>
					<Text className='text-[#78716C] font-pretendard-regular text-[14px] text-center leading-6'>
						오늘 전시, 즐거우셨나요?{'\n'}관람 기록은 아카이브에서 다시 볼 수 있어요
					</Text>
				</View>

				<Text className='text-[#1C1917] font-pretendard-semibold text-[16px] mb-4'>
					주변 즐길거리
				</Text>
				<View className='flex-row flex-wrap justify-between'>
					{places.map((place) => (
						<View key={place.id} className='rounded-2xl overflow-hidden mb-3 w-[48%]'>
							{place.imageUrl ? (
								<Image
									source={{ uri: place.imageUrl }}
									style={{ width: '100%', height: 130 }}
									resizeMode='cover'
								/>
							) : (
								<View style={{ width: '100%', height: 130, backgroundColor: '#E7E5E4' }} />
							)}
							<LinearGradient
								colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
								locations={[0, 0.5, 1]}
								className='absolute left-0 right-0 bottom-0 h-[90px]'
							/>
							<View className='absolute top-2 left-2 rounded-full px-2 py-0.5 bg-black/55'>
								<Text className='text-white font-pretendard-semibold text-[10px]'>
									{CATEGORY_LABEL[place.category]}
								</Text>
							</View>
							<View className='absolute left-2.5 right-2.5 bottom-2'>
								<Text
									className='text-white font-pretendard-semibold text-[13px]'
									numberOfLines={1}
									style={TEXT_SHADOW}
								>
									{place.name}
								</Text>
								<Text
									className='text-white/90 font-pretendard-medium text-[11px] mt-0.5'
									numberOfLines={1}
									style={TEXT_SHADOW}
								>
									{place.distance} · {place.address}
								</Text>
							</View>
						</View>
					))}
				</View>
			</ScrollView>

			<View className='absolute left-0 right-0 bottom-0 px-6 pb-10'>
				<Pressable
					className='rounded-2xl items-center py-4 bg-[#3B82F6]'
					onPress={() => router.dismissTo('/(tabs)')}
					accessibilityRole='button'
					accessibilityLabel='다른 전시 보러가기'
				>
					<Text className='text-white font-pretendard-semibold text-[16px]'>
						다른 전시 보러가기
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
