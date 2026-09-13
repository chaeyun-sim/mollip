import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNearbyPlaces, type NearbyPlace } from '@/src/hooks/useNearbyPlaces';
import { supabase } from '@/src/utils/supabase';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { Screen } from '@/src/components/layout/Screen';
import { ExternalMapSheet, type ExternalMapTarget } from '@/src/components/map/ExternalMapSheet';
import { NearbyPlaceRow, type PlaceVariant } from '@/src/components/guide/NearbyPlaceRow';
import { NearbyPlaceRowSkeleton } from '@/src/components/guide/NearbyPlaceRowSkeleton';

// 셀프 가이드를 종료할 때 보여주는 마무리 화면 — create-description의 종료 확인 후 진입.
// 여기서 "다른 전시 보러가기"를 눌러야 메인 서비스로 돌아간다 (create-description.tsx 참고).
// 다른 (guide) 화면들과 달리 흰 배경 — 종료의 산뜻한 느낌을 위해 의도적으로 다른 톤.
export default function ExitSummaryScreen() {
	const router = useRouter();
	const exitImmersive = useImmersiveStore((s) => s.exit);

	// visits가 "날짜::전시" 복합 키라 todayKey()만으로 찾을 수 없다 — playlist.tsx가
	// exitImmersive() 호출 전에 route param으로 넘겨준다.
	const { exhibitionId: exhibitionIdParam } = useLocalSearchParams<{ exhibitionId?: string }>();
	const exhibitionId = exhibitionIdParam || null;

	const [location, setLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	useEffect(() => {
		async function resolveLocation() {
			// 1순위: DB에서 전시 좌표 조회 (gps_x = 경도, gps_y = 위도)
			if (exhibitionId) {
				const { data } = await supabase
					.from('exhibitions')
					.select('museums(gps_x, gps_y)')
					.eq('id', Number(exhibitionId))
					.single();
				const museum = Array.isArray(data?.museums) ? data?.museums[0] : data?.museums;
				if (museum?.gps_x && museum?.gps_y) {
					const lat = parseFloat(museum.gps_y);
					const lng = parseFloat(museum.gps_x);
					if (!isNaN(lat) && !isNaN(lng)) {
						setLocation({ latitude: lat, longitude: lng });
						return;
					}
				}
			}
			// 2순위: 현재 GPS 위치
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') return;
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
				.then((pos) => {
					setLocation({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
					});
				})
				.catch(() => {
					setLocation(null);
				});
		}
		resolveLocation();
	}, [exhibitionId]);

	const { data: nearby, isLoading: placesLoading } = useNearbyPlaces(location);
	const [externalMapTarget, setExternalMapTarget] = useState<ExternalMapTarget | null>(null);

	function renderNearbySection(label: string, places: NearbyPlace[], variant: PlaceVariant) {
		return (
			<View className="mb-5">
				<Text className="text-gray600 font-pretendard-semibold text-[13px] mb-2.5">{label}</Text>
				<View>
					{placesLoading ? (
						[0, 1, 2].map((i) => <NearbyPlaceRowSkeleton key={i} isFirst={i === 0} />)
					) : places.length > 0 ? (
						places.map((place, index) => (
							<NearbyPlaceRow
								key={place.id}
								place={place}
								variant={variant}
								isFirst={index === 0}
								onOpenExternalMap={setExternalMapTarget}
							/>
						))
					) : (
						<Text className="text-gray500 font-pretendard-regular text-[13px] py-2">
							주변 장소를 찾지 못했어요
						</Text>
					)}
				</View>
			</View>
		);
	}

	return (
		<Screen variant="warm" edges={['top', 'bottom']}>
			<ScrollView
				className="flex-1"
				contentContainerClassName='pt-5 pb-[120px]'
				showsVerticalScrollIndicator={false}
			>
				<View className="items-center mb-10">
					<View className="w-16 h-16 rounded-full items-center justify-center mb-5 bg-bg-tonal">
						<Ionicons name="checkmark" size={28} className="text-primary" />
					</View>
					<Text className="text-gray900 font-pretendard-bold text-[22px] text-center mb-2">
						오디오 가이드가 종료되었습니다.
					</Text>
					<Text className="text-gray600 font-pretendard-regular text-[14px] text-center leading-6">
						오늘 전시, 즐거우셨나요?{'\n'}관람 기록은 아카이브에서 다시 볼 수 있어요
					</Text>
				</View>

				<Text className="text-gray900 font-pretendard-semibold text-[16px] mb-4">
					주변 즐길거리
				</Text>

				{renderNearbySection('카페', nearby.cafes, 'cafe')}
				{renderNearbySection('볼거리', nearby.attractions, 'attraction')}
			</ScrollView>

			<View className="absolute left-0 right-0 bottom-0 px-6 pb-10">
				<Pressable
					className="rounded-2xl items-center py-4 bg-secondary"
					onPress={() => {
						// 방어적으로 한 번 더 리셋 — 진입 경로가 늘어나도 몰입 모드가 남지 않도록
						exitImmersive();
						router.dismissTo('/(tabs)');
					}}
					accessibilityRole="button"
					accessibilityLabel="다른 전시 보러가기"
				>
					<Text className="text-white font-pretendard-semibold text-[16px]">
						다른 전시 보러가기
					</Text>
				</Pressable>
			</View>

			{externalMapTarget && (
				<ExternalMapSheet target={externalMapTarget} onClose={() => setExternalMapTarget(null)} />
			)}
		</Screen>
	);
}
