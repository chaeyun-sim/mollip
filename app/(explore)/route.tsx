import { Ionicons } from '@expo/vector-icons';
import {
	NaverMapMarkerOverlay,
	NaverMapPathOverlay,
	NaverMapView,
	type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getWalkingRoute, type RouteCoord, type RouteResult } from '@/src/api/tmap';
import { useExhibitionData } from '@/src/hooks/useExhibitionData';
import { useMuseums } from '@/src/hooks/useMuseums';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { supabase } from '@/src/utils/supabase';
import { distanceKm } from '@/src/utils/mapUtils';

interface Waypoint {
	id: string;
	coord: RouteCoord;
	label: string;
	exhibitionId?: string;
}

interface NearbyExhibition {
	id: string;
	title: string;
	venue: string;
	coord: RouteCoord;
	distanceM: number;
}

const NEARBY_THRESHOLD_M = 500;
const ROUTE_COLOR = '#FF2D78';

export default function RouteScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { exhibition } = useExhibitionData(id ?? '');
	const { currentCoord } = useUserLocation();
	const allVenues = useMuseums();
	const mapRef = useRef<NaverMapViewRef>(null);

	const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
	const [routeSegments, setRouteSegments] = useState<RouteResult[]>([]);
	const [building, setBuilding] = useState(false);
	const [routeReady, setRouteReady] = useState(false);
	const [nearbyExhibitions, setNearbyExhibitions] = useState<NearbyExhibition[]>([]);
	const [sheetVisible, setSheetVisible] = useState(false);
	const initializedRef = useRef(false);

	// 초기 핀: 내 위치(1) + 목적지 전시(2)
	useEffect(() => {
		if (initializedRef.current) return;
		if (!currentCoord || !exhibition?.coordinates) return;

		initializedRef.current = true;
		setWaypoints([
			{ id: 'start', coord: currentCoord, label: '내 위치' },
			{ id: `dest-${id}`, coord: exhibition.coordinates, label: exhibition.title, exhibitionId: id },
		]);

		setTimeout(() => {
			const pad = 0.008;
			const lats = [currentCoord.latitude, exhibition.coordinates!.latitude];
			const lngs = [currentCoord.longitude, exhibition.coordinates!.longitude];
			mapRef.current?.animateCameraWithTwoCoords({
				coord1: { latitude: Math.min(...lats) - pad, longitude: Math.min(...lngs) - pad },
				coord2: { latitude: Math.max(...lats) + pad, longitude: Math.max(...lngs) + pad },
			});
		}, 400);
	}, [currentCoord, exhibition, id]);

	// 지도 탭 → 목적지 앞에 경유지 삽입 (경로 생성 후에도 추가 가능)
	const handleTapMap = useCallback(
		(e: { latitude: number; longitude: number }) => {
			if (building) return;

			const newWp: Waypoint = {
				id: `wp-${Date.now()}`,
				coord: { latitude: e.latitude, longitude: e.longitude },
				label: '경유지',
			};

			setWaypoints((prev) => {
				if (prev.length >= 2) {
					return [...prev.slice(0, -1), newWp, prev[prev.length - 1]];
				}
				return [...prev, newWp];
			});

			// 경로 생성 후 경유지 추가 시 → 재생성 필요 상태로
			if (routeReady) {
				setRouteReady(false);
				setRouteSegments([]);
			}
		},
		[building, routeReady],
	);

	// 경유지 삭제 (출발·도착 제외)
	const removeWaypoint = useCallback(
		(wpId: string) => {
			setWaypoints((prev) => prev.filter((wp) => wp.id !== wpId));
			if (routeReady) {
				setRouteReady(false);
				setRouteSegments([]);
			}
		},
		[routeReady],
	);

	// 근처 전시를 경유지로 추가
	const addNearbyAsWaypoint = useCallback(
		(ex: NearbyExhibition) => {
			const newWp: Waypoint = {
				id: `nearby-${ex.id}`,
				coord: ex.coord,
				label: ex.venue || ex.title,
				exhibitionId: ex.id,
			};
			setWaypoints((prev) => {
				if (prev.length >= 2) {
					return [...prev.slice(0, -1), newWp, prev[prev.length - 1]];
				}
				return [...prev, newWp];
			});
			setRouteReady(false);
			setRouteSegments([]);
			setSheetVisible(false);
		},
		[],
	);

	// 경로 생성
	const handleBuildRoute = useCallback(async () => {
		if (waypoints.length < 2) return;

		setBuilding(true);
		setRouteReady(false);
		setRouteSegments([]);

		try {
			const segments: RouteResult[] = [];
			for (let i = 0; i < waypoints.length - 1; i++) {
				const from = waypoints[i];
				const to = waypoints[i + 1];
				const seg = await getWalkingRoute(from.coord, to.coord, from.label, to.label);
				console.log(`[route] segment ${i}: legs=${seg.legs.length}, coords=${seg.legs.flatMap(l => l.coords).length}`);
				// ODsay가 경로를 못 찾으면 (거리 초과 등) 직선 fallback 사용
				if (seg.legs.length === 0) {
					seg.legs = [{
						mode: 'walk',
						coords: [from.coord, to.coord],
						sectionSeconds: 0,
						distanceMeters: 0,
						startName: from.label,
						endName: to.label,
					}];
				}
				segments.push(seg);
			}

			setRouteSegments(segments);
			setRouteReady(true);

			const allCoords = segments.flatMap((s) => s.legs.flatMap((l) => l.coords));
			if (allCoords.length >= 2) {
				const pad = 0.005;
				const lats = allCoords.map((c) => c.latitude);
				const lngs = allCoords.map((c) => c.longitude);
				mapRef.current?.animateCameraWithTwoCoords({
					coord1: { latitude: Math.min(...lats) - pad, longitude: Math.min(...lngs) - pad },
					coord2: { latitude: Math.max(...lats) + pad, longitude: Math.max(...lngs) + pad },
				});
			}

			await findNearbyExhibitions(allCoords, waypoints);
		} catch (e) {
			console.warn('[route] build error:', e);
		} finally {
			setBuilding(false);
		}
	}, [waypoints]);

	// 경로 근처 전시 조회
	const findNearbyExhibitions = async (routeCoords: RouteCoord[], currentWaypoints: Waypoint[]) => {
		if (routeCoords.length === 0) return;

		try {
			const lats = routeCoords.map((c) => c.latitude);
			const lngs = routeCoords.map((c) => c.longitude);
			const pad = 0.015;
			const minLat = Math.min(...lats) - pad;
			const maxLat = Math.max(...lats) + pad;
			const minLng = Math.min(...lngs) - pad;
			const maxLng = Math.max(...lngs) + pad;

			// 경유지·도착지로 이미 추가된 전시는 근처 전시에서 제외
			const excludeIds = currentWaypoints
				.filter((wp) => wp.exhibitionId)
				.map((wp) => Number(wp.exhibitionId))
				.filter((n) => n > 0);

			const today = new Date().toISOString().slice(0, 10);
			let query = supabase
				.from('exhibitions')
				.select('id, title, venue_name_fallback, museums!museum_id(gps_x, gps_y)')
				.not('museum_id', 'is', null)
				.gte('end_date', today);

			for (const excludeId of excludeIds) {
				query = query.neq('id', excludeId);
			}

			const { data } = await query;

			if (!data) return;

			const nearby: NearbyExhibition[] = [];
			for (const ex of data) {
				const museum = (ex as { museums?: { gps_x?: string; gps_y?: string } | null }).museums;
				if (!museum?.gps_x || !museum?.gps_y) continue;

				const exCoord: RouteCoord = {
					latitude: parseFloat(museum.gps_y),
					longitude: parseFloat(museum.gps_x),
				};

				if (
					exCoord.latitude < minLat ||
					exCoord.latitude > maxLat ||
					exCoord.longitude < minLng ||
					exCoord.longitude > maxLng
				)
					continue;

				let minDist = Infinity;
				for (let i = 0; i < routeCoords.length; i += 10) {
					const c = routeCoords[i];
					const d = distanceKm(c.latitude, c.longitude, exCoord.latitude, exCoord.longitude) * 1000;
					if (d < minDist) minDist = d;
				}

				if (minDist <= NEARBY_THRESHOLD_M) {
					nearby.push({
						id: String(ex.id),
						title: ex.title,
						venue: ex.venue_name_fallback ?? '',
						coord: exCoord,
						distanceM: Math.round(minDist),
					});
				}
			}

			nearby.sort((a, b) => a.distanceM - b.distanceM);
			setNearbyExhibitions(nearby);

			if (nearby.length > 0) {
				Alert.alert(
					'가는 길에서 볼 수 있는 전시를 찾았어요!',
					`경로 근처 ${nearby.length}개 전시가 있어요`,
					[
						{ text: '괜찮아요', style: 'cancel' },
						{ text: '확인하기', onPress: () => setSheetVisible(true) },
					],
				);
			}
		} catch (e) {
			console.warn('[route] nearby error:', e);
		}
	};

	const allLegs = useMemo(() => routeSegments.flatMap((s) => s.legs), [routeSegments]);

	const handleReset = () => {
		setRouteSegments([]);
		setRouteReady(false);
		setNearbyExhibitions([]);
	};

	function renderWaypointLabel(index: number, total: number) {
		if (index === 0) return '출발';
		if (index === total - 1) return '도착';
		return `경유 ${index}`;
	}

	return (
		<View className='flex-1'>
			<NaverMapView
				ref={mapRef}
				style={{ flex: 1 }}
				mapType='Basic'
				isShowZoomControls={false}
				isIndoorEnabled={false}
				locationOverlay={
					currentCoord ? { isVisible: true, position: currentCoord } : undefined
				}
				onTapMap={handleTapMap}
			>
				{/* 전시장 전체 dot */}
				{allVenues.map((venue) => (
					<NaverMapMarkerOverlay
						key={venue.venueName}
						latitude={venue.coordinates.latitude}
						longitude={venue.coordinates.longitude}
						width={8}
						height={8}
						anchor={{ x: 0.5, y: 0.5 }}
						zIndex={1}
					>
						<View
							collapsable={false}
							className='w-2 h-2 rounded-full'
							style={{ backgroundColor: 'rgba(28,25,23,0.25)' }}
						/>
					</NaverMapMarkerOverlay>
				))}

				{/* 경로 — 글로우 레이어 + 메인 라인 */}
				{allLegs.flatMap((leg, i) => {
					if (leg.coords.length < 2) return [];
					return [
						<NaverMapPathOverlay
							key={`glow-${i}`}
							coords={leg.coords}
							width={10}
							color='rgba(255,45,120,0.25)'
							outlineWidth={0}
						/>,
						<NaverMapPathOverlay
							key={`line-${i}`}
							coords={leg.coords}
							width={4}
							color={ROUTE_COLOR}
							outlineWidth={1}
							outlineColor='white'
						/>,
					];
				})}

				{/* 핀 마커 — key에 인덱스 포함해야 position 바뀔 때 번호가 올바르게 갱신됨 */}
				{waypoints.map((wp, i) => (
					<NaverMapMarkerOverlay
						key={`${wp.id}-${i}`}
						latitude={wp.coord.latitude}
						longitude={wp.coord.longitude}
						width={34}
						height={34}
						anchor={{ x: 0.5, y: 1 }}
						zIndex={10 + i}
					>
						<View
							collapsable={false}
							className='w-[34px] h-[34px] rounded-full items-center justify-center'
							style={{
								backgroundColor:
									i === 0 ? '#1C1917' : i === waypoints.length - 1 ? ROUTE_COLOR : '#D97706',
							}}
						>
							<Text className='text-white font-pretendard-bold text-[14px]'>
								{i + 1}
							</Text>
						</View>
					</NaverMapMarkerOverlay>
				))}

				{/* 근처 전시 마커 — 핀 + 라벨 */}
				{nearbyExhibitions.map((ex) => (
					<NaverMapMarkerOverlay
						key={`nearby-${ex.id}`}
						latitude={ex.coord.latitude}
						longitude={ex.coord.longitude}
						width={180}
						height={64}
						anchor={{ x: 0.5, y: 1 }}
						zIndex={8}
						onTap={() => setSheetVisible(true)}
					>
						<View collapsable={false} className='items-center'>
							{/* 라벨 말풍선 */}
							<View className='bg-amber-400 rounded-xl px-3 py-2 mb-1 flex-row items-center gap-1.5'>
								<Ionicons name='star' size={13} color='white' />
								<Text
									className='text-white font-pretendard-semibold text-[13px]'
									numberOfLines={1}
									style={{ maxWidth: 140 }}
								>
									{ex.venue || ex.title}
								</Text>
							</View>
							{/* 핀 꼭지 */}
							<View
								style={{
									width: 0,
									height: 0,
									borderLeftWidth: 6,
									borderRightWidth: 6,
									borderTopWidth: 7,
									borderLeftColor: 'transparent',
									borderRightColor: 'transparent',
									borderTopColor: '#F59E0B',
								}}
							/>
						</View>
					</NaverMapMarkerOverlay>
				))}
			</NaverMapView>

			{/* 상단 헤더 */}
			<SafeAreaView
				className='absolute top-0 left-0 right-0'
				edges={['top']}
				pointerEvents='box-none'
			>
				<View className='flex-row items-center px-5 pt-2 gap-3'>
					<Pressable
						onPress={() => router.back()}
						className='w-10 h-10 rounded-full bg-white/90 items-center justify-center'
						hitSlop={8}
						accessibilityLabel='뒤로가기'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons name='chevron-back' size={22} color='#1a1a1a' />
					</Pressable>
					<View className='flex-1 bg-white/90 rounded-2xl px-4 py-2.5'>
						<Text className='font-pretendard-semibold text-[15px] text-[#1C1917]'>
							관람 루트
						</Text>
						<Text className='font-pretendard-regular text-[11px] text-gray-400 mt-0.5'>
							{routeReady ? '지도를 탭해 경유지를 더 추가할 수 있어요' : '지도를 탭해 경유지를 추가하세요'}
						</Text>
					</View>
					{routeReady && (
						<Pressable
							onPress={handleReset}
							className='bg-white/90 rounded-2xl px-3 py-2.5'
							hitSlop={8}
							accessibilityLabel='초기화'
							accessibilityRole='button'
						>
							<Text className='font-pretendard-medium text-[13px] text-[#1C1917]'>
								초기화
							</Text>
						</Pressable>
					)}
				</View>
			</SafeAreaView>

			{/* 하단 패널 */}
			<SafeAreaView edges={['bottom']} className='bg-white border-t border-gray-100'>
				{waypoints.length > 0 && (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className='border-b border-gray-100'
						contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
					>
						{waypoints.map((wp, i) => (
							<View
								key={wp.id}
								className='flex-row items-center gap-1.5 bg-[#F8F6F2] rounded-full px-3 py-1.5'
							>
								<View
									className='w-5 h-5 rounded-full items-center justify-center'
									style={{
										backgroundColor:
											i === 0 ? '#1C1917' : i === waypoints.length - 1 ? ROUTE_COLOR : '#D97706',
									}}
								>
									<Text className='text-white font-pretendard-bold text-[10px]'>
										{i + 1}
									</Text>
								</View>
								<Text
									className='font-pretendard-regular text-[13px] text-[#1C1917]'
									numberOfLines={1}
									style={{ maxWidth: 120 }}
								>
									{renderWaypointLabel(i, waypoints.length)}
								</Text>
								{i !== 0 && i !== waypoints.length - 1 && (
									<Pressable
										onPress={() => removeWaypoint(wp.id)}
										hitSlop={6}
										accessibilityLabel='경유지 제거'
										accessibilityRole='button'
									>
										<Ionicons name='close-circle' size={14} color='#9CA3AF' />
									</Pressable>
								)}
							</View>
						))}
					</ScrollView>
				)}

				<View className='px-5 py-3 flex-row gap-2'>
					{routeReady && nearbyExhibitions.length > 0 && (
						<Pressable
							onPress={() => setSheetVisible(true)}
							className='rounded-2xl py-4 items-center bg-amber-400'
							style={{ flex: 1 }}
							accessibilityLabel='근처 전시 보기'
							accessibilityRole='button'
						>
							<Text className='font-pretendard-semibold text-[15px] text-white'>
								근처 전시 {nearbyExhibitions.length}개
							</Text>
						</Pressable>
					)}
					<Pressable
						onPress={handleBuildRoute}
						disabled={waypoints.length < 2 || building}
						className='rounded-2xl py-4 items-center'
						style={{
							flex: routeReady && nearbyExhibitions.length > 0 ? undefined : 1,
							minWidth: routeReady && nearbyExhibitions.length > 0 ? 120 : undefined,
							backgroundColor: waypoints.length < 2 ? '#E7E5E4' : '#1C1917',
						}}
						accessibilityLabel={routeReady ? '경로 재생성' : '경로 생성'}
						accessibilityRole='button'
					>
						{building ? (
							<ActivityIndicator color='white' />
						) : (
							<Text className='font-pretendard-semibold text-[15px] text-white'>
								{routeReady ? '재생성' : '경로 생성'}
							</Text>
						)}
					</Pressable>
				</View>
			</SafeAreaView>

			{/* 근처 전시 시트 */}
			<Modal
				visible={sheetVisible}
				transparent
				animationType='slide'
				onRequestClose={() => setSheetVisible(false)}
			>
				<View className='flex-1 justify-end'>
					<Pressable
						className='flex-1'
						onPress={() => setSheetVisible(false)}
						accessibilityLabel='닫기'
						accessibilityRole='button'
					/>
					<View
						className='bg-white rounded-t-3xl px-6 pt-5'
						style={{ paddingBottom: insets.bottom + 24, maxHeight: '65%' }}
					>
						<View className='flex-row items-center justify-between mb-1'>
							<Text className='font-pretendard-semibold text-[17px] text-[#1C1917]'>
								가는 길에서 볼 수 있는 전시
							</Text>
							<Pressable
								onPress={() => setSheetVisible(false)}
								hitSlop={8}
								accessibilityLabel='닫기'
								accessibilityRole='button'
							>
								<Ionicons name='close' size={22} color='#1C1917' />
							</Pressable>
						</View>
						<Text className='font-pretendard-regular text-[13px] text-gray-400 mb-4'>
							경로 500m 이내 진행 중인 전시예요
						</Text>
						<ScrollView showsVerticalScrollIndicator={false}>
							{nearbyExhibitions.map((ex) => (
								<View
									key={ex.id}
									className='py-3 border-b border-gray-100'
								>
									<View className='flex-row items-start justify-between mb-2'>
										<Pressable
											className='flex-1 mr-3'
											onPress={() => {
												setSheetVisible(false);
												router.push(`/(explore)/${ex.id}`);
											}}
											accessibilityRole='button'
										>
											<Text
												className='font-pretendard-medium text-[15px] text-[#1C1917]'
												numberOfLines={1}
											>
												{ex.title}
											</Text>
											<Text className='font-pretendard-regular text-[12px] text-gray-500 mt-0.5'>
												{ex.venue} ·{' '}
												{ex.distanceM < 1000
													? `${ex.distanceM}m`
													: `${(ex.distanceM / 1000).toFixed(1)}km`}
											</Text>
										</Pressable>
									</View>
									<Pressable
										onPress={() => addNearbyAsWaypoint(ex)}
										className='self-start flex-row items-center gap-1.5 bg-[#F8F6F2] rounded-full px-3 py-1.5'
										accessibilityLabel='경로에 추가'
										accessibilityRole='button'
									>
										<Ionicons name='add-circle-outline' size={15} color='#1C1917' />
										<Text className='font-pretendard-medium text-[13px] text-[#1C1917]'>
											경로에 추가
										</Text>
									</Pressable>
								</View>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
}
