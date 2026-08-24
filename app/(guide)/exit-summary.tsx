import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNearbyPlaces, type NearbyPlace } from '@/src/hooks/useNearbyPlaces';
import { supabase } from '@/src/utils/supabase';
import { todayKey, useVisitStore } from '@/src/store/visitStore';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { colors } from '@/src/constants/colors';
import { Screen } from '@/src/components/layout/Screen';

const TEXT_SHADOW = {
	textShadowColor: 'rgba(0,0,0,0.6)',
	textShadowOffset: { width: 0, height: 1 },
	textShadowRadius: 6,
};

function PlaceCard({ place }: { place: NearbyPlace }) {
	return (
		<View className='rounded-2xl overflow-hidden mb-3 w-[48%] h-[130px] bg-divider'>
			<LinearGradient
				colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
				locations={[0, 0.5, 1]}
				className='absolute left-0 right-0 bottom-0 h-[90px]'
			/>
			<View className='absolute left-2.5 right-2.5 bottom-2.5'>
				<Text
					className='text-white font-pretendard-semibold text-[13px]'
					numberOfLines={1}
					style={TEXT_SHADOW}
				>
					{place.name}
				</Text>
				<Text
					className='text-white/80 font-pretendard-regular text-[10px] mt-0.5'
					numberOfLines={1}
					style={TEXT_SHADOW}
				>
					{place.distance} · {place.address}
				</Text>
			</View>
		</View>
	);
}

function SkeletonCard() {
	return <View className='rounded-2xl mb-3 w-[48%] h-[130px] bg-divider' />;
}

// 셀프 가이드를 종료할 때 보여주는 마무리 화면 — create-description의 종료 확인 후 진입.
// 여기서 "다른 전시 보러가기"를 눌러야 메인 서비스로 돌아간다 (create-description.tsx 참고).
// 다른 (guide) 화면들과 달리 흰 배경 — 종료의 산뜻한 느낌을 위해 의도적으로 다른 톤.
export default function ExitSummaryScreen() {
	const router = useRouter();
	const exitImmersive = useImmersiveStore((s) => s.exit);

	const exhibitionId = useVisitStore((s) => s.visits[todayKey()]?.exhibitionId);

	const [location, setLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	useEffect(() => {
		async function resolveLocation() {
			console.log('[exit] exhibitionId:', exhibitionId);
			// 1순위: DB에서 전시 좌표 조회 (gps_x = 경도, gps_y = 위도)
			if (exhibitionId) {
				const { data, error } = await supabase
					.from('exhibitions')
					.select('museums(gps_x, gps_y)')
					.eq('id', Number(exhibitionId))
					.single();
				console.log('[exit] db result:', JSON.stringify(data), error?.message);
				const museum = Array.isArray(data?.museums)
					? data?.museums[0]
					: data?.museums;
				console.log('[exit] museum coords:', museum?.gps_x, museum?.gps_y);
				if (museum?.gps_x && museum?.gps_y) {
					const lat = parseFloat(museum.gps_y);
					const lng = parseFloat(museum.gps_x);
					if (!isNaN(lat) && !isNaN(lng)) {
						console.log('[exit] setLocation from DB:', lat, lng);
						setLocation({ latitude: lat, longitude: lng });
						return;
					}
				}
			}
			// 2순위: 현재 GPS 위치
			console.log('[exit] falling back to GPS');
			const { status } = await Location.requestForegroundPermissionsAsync();
			console.log('[exit] GPS permission:', status);
			if (status !== 'granted') return;
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
				.then((pos) => {
					console.log(
						'[exit] GPS coords:',
						pos.coords.latitude,
						pos.coords.longitude,
					);
					setLocation({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
					});
				})
				.catch((e) => {
					console.log('[exit] GPS error:', e);
					setLocation(null);
				});
		}
		resolveLocation();
	}, [exhibitionId]);

	const { data: nearby, isLoading: placesLoading } = useNearbyPlaces(location);

	console.log(nearby);

	function renderNearbySection(label: string, places: NearbyPlace[]) {
		return (
			<View className='mb-5'>
				<Text className='text-tertiary font-pretendard-semibold text-[13px] mb-2.5'>
					{label}
				</Text>
				<View className='flex-row flex-wrap justify-between'>
					{placesLoading ? (
						[0, 1, 2].map((i) => <SkeletonCard key={i} />)
					) : places.length > 0 ? (
						places.map((place) => <PlaceCard key={place.id} place={place} />)
					) : (
						<Text className='text-muted font-pretendard-regular text-[13px]'>
							주변 장소를 찾지 못했어요
						</Text>
					)}
				</View>
			</View>
		);
	}

	return (
		<Screen variant='warm' edges={['top', 'bottom']}>
			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
				showsVerticalScrollIndicator={false}
			>
				<View className='items-center mb-10'>
					<View className='w-16 h-16 rounded-full items-center justify-center mb-5 bg-bg-tonal'>
						<Ionicons name='checkmark' size={28} color={colors.accent} />
					</View>
					<Text className='text-primary font-pretendard-bold text-[22px] text-center mb-2'>
						오디오 가이드가 종료되었습니다.
					</Text>
					<Text className='text-tertiary font-pretendard-regular text-[14px] text-center leading-6'>
						오늘 전시, 즐거우셨나요?{'\n'}관람 기록은 아카이브에서 다시 볼 수 있어요
					</Text>
				</View>

				<Text className='text-primary font-pretendard-semibold text-[16px] mb-4'>
					주변 즐길거리
				</Text>

				{renderNearbySection('카페', nearby.cafes)}
				{renderNearbySection('볼거리', nearby.attractions)}
			</ScrollView>

			<View className='absolute left-0 right-0 bottom-0 px-6 pb-10'>
				<Pressable
					className='rounded-2xl items-center py-4 bg-accent'
					onPress={() => {
						// 방어적으로 한 번 더 리셋 — 진입 경로가 늘어나도 몰입 모드가 남지 않도록
						exitImmersive();
						router.dismissTo('/(tabs)');
					}}
					accessibilityRole='button'
					accessibilityLabel='다른 전시 보러가기'
				>
					<Text className='text-white font-pretendard-semibold text-[16px]'>
						다른 전시 보러가기
					</Text>
				</Pressable>
			</View>
		</Screen>
	);
}
