import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
	type LayoutChangeEvent,
} from 'react-native';
import { searchKakaoKeyword, type KakaoLocalItem } from '@/src/api/kakao';
import type { RouteEndpoint } from '@/src/hooks/useDirections';
import type { RecentLocation } from '@/src/hooks/useRecentLocations';
import type { VenueGroup } from '@/src/data/venues';

type EditingField = 'origin' | 'destination' | null;

export interface RouteSearchSuggestion {
	key: string;
	label: string;
	subtitle?: string;
	endpoint: RouteEndpoint;
}

interface RoutePlanningBarProps {
	origin: RouteEndpoint | null;
	destination: RouteEndpoint | null;
	venues: VenueGroup[];
	hasCurrentLocation: boolean;
	recentLocations: RecentLocation[];
	onSelectOrigin: (endpoint: RouteEndpoint) => void;
	onSelectDestination: (endpoint: RouteEndpoint) => void;
	onUseCurrentLocation: () => void;
	onFocusLocation: (coord: { latitude: number; longitude: number }) => void;
	onAddRecent: (endpoint: RouteEndpoint, subtitle?: string) => void;
	onSwap: () => void;
	onConfirm: () => void;
	onClose: () => void;
}

const CARD_SHADOW = {
	shadowColor: '#000',
	shadowOpacity: 0.12,
	shadowRadius: 8,
	shadowOffset: { width: 0, height: 2 },
	elevation: 4,
} as const;

function venueToEndpoint(venue: VenueGroup): RouteEndpoint {
	return { name: venue.venueName, coord: venue.coordinates };
}

function buildVenueSuggestions(
	venues: VenueGroup[],
	query: string,
): RouteSearchSuggestion[] {
	const q = query.trim().toLowerCase();
	const list = q
		? venues.filter((v) => v.venueName.toLowerCase().includes(q))
		: venues.slice(0, 8);
	return list.slice(0, 6).map((v) => ({
		key: `venue-${v.venueName}`,
		label: v.venueName,
		subtitle: v.venueAddress,
		endpoint: venueToEndpoint(v),
	}));
}

function kakaoToSuggestion(
	item: KakaoLocalItem,
	index: number,
): RouteSearchSuggestion {
	return {
		key: `kakao-${item.place_name}-${index}`,
		label: item.place_name,
		subtitle: item.road_address_name || item.address_name || undefined,
		endpoint: {
			name: item.place_name,
			coord: { latitude: parseFloat(item.y), longitude: parseFloat(item.x) },
		},
	};
}

export function RoutePlanningBar({
	origin,
	destination,
	venues,
	hasCurrentLocation,
	recentLocations,
	onSelectOrigin,
	onSelectDestination,
	onUseCurrentLocation,
	onFocusLocation,
	onAddRecent,
	onSwap,
	onConfirm,
	onClose,
}: RoutePlanningBarProps) {
	// 출발지가 없으면 마운트 시 바로 출발지 검색창을 열어준다
	const [editing, setEditing] = useState<EditingField>(() => (origin == null ? 'origin' : null));
	const [query, setQuery] = useState('');
	const [barHeight, setBarHeight] = useState(0);
	const [kakaoRows, setKakaoRows] = useState<KakaoLocalItem[]>([]);
	const [kakaoLoading, setKakaoLoading] = useState(false);
	const [kakaoError, setKakaoError] = useState(false);

	useEffect(() => {
		if (editing == null) {
			setKakaoRows([]);
			setKakaoError(false);
			return;
		}
		const q = query.trim();
		if (q.length < 1) {
			setKakaoRows([]);
			setKakaoLoading(false);
			setKakaoError(false);
			return;
		}
		let cancelled = false;
		setKakaoLoading(true);
		setKakaoError(false);
		const timer = setTimeout(() => {
			searchKakaoKeyword(q)
				.then((rows) => {
					if (!cancelled) setKakaoRows(rows);
				})
				.catch(() => {
					if (!cancelled) {
						setKakaoRows([]);
						setKakaoError(true);
					}
				})
				.finally(() => {
					if (!cancelled) setKakaoLoading(false);
				});
		}, 280);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [editing, query]);

	const venueSuggestions = useMemo(
		() => (editing ? buildVenueSuggestions(venues, query) : []),
		[editing, venues, query],
	);

	const addressSuggestions = useMemo(
		() => kakaoRows.map((item, i) => kakaoToSuggestion(item, i)),
		[kakaoRows],
	);

	const recentSuggestions = useMemo((): RouteSearchSuggestion[] => {
		if (query.trim().length > 0) return [];
		return recentLocations.map((r, i) => ({
			key: `recent-${i}`,
			label: r.name,
			subtitle: r.subtitle,
			endpoint: { name: r.name, coord: r.coord },
		}));
	}, [query, recentLocations]);

	const suggestions = useMemo(() => {
		if (query.trim().length === 0) return recentSuggestions;
		const seen = new Set<string>();
		const merged: RouteSearchSuggestion[] = [];
		for (const item of [...venueSuggestions, ...addressSuggestions]) {
			if (seen.has(item.label)) continue;
			seen.add(item.label);
			merged.push(item);
			if (merged.length >= 10) break;
		}
		return merged;
	}, [query, recentSuggestions, venueSuggestions, addressSuggestions]);

	const canConfirm = origin != null && destination != null;

	const openEditor = (field: EditingField) => {
		setEditing(field);
		setQuery('');
		setKakaoRows([]);
	};

	const pickSuggestion = (item: RouteSearchSuggestion) => {
		if (editing === 'origin') onSelectOrigin(item.endpoint);
		else if (editing === 'destination') onSelectDestination(item.endpoint);
		onFocusLocation(item.endpoint.coord);
		onAddRecent(item.endpoint, item.subtitle);
		setEditing(null);
		setQuery('');
		setKakaoRows([]);
	};

	const closeDropdown = () => {
		setEditing(null);
		setQuery('');
		setKakaoRows([]);
	};

	const onBarLayout = (e: LayoutChangeEvent) => {
		setBarHeight(e.nativeEvent.layout.height);
	};

	return (
		<View>
			<View className='flex-row items-start gap-2' onLayout={onBarLayout}>
				<View
					className='flex-1 rounded-2xl bg-white px-3 py-2.5'
					style={CARD_SHADOW}
				>
					<Pressable
						onPress={() => openEditor('origin')}
						className='flex-row items-center gap-2.5 min-h-[36px]'
						accessibilityRole='button'
						accessibilityLabel='출발지 선택'
					>
						<View className='w-2.5 h-2.5 rounded-full bg-[#22C55E]' />
						<Text
							className='flex-1 text-[14px] font-pretendard-medium text-[#1C1917]'
							numberOfLines={1}
						>
							{origin?.name ?? '출발지를 선택하세요'}
						</Text>
					</Pressable>

					<View className='h-px bg-black/[0.06] my-1.5 ml-5' />

					<Pressable
						onPress={() => openEditor('destination')}
						className='flex-row items-center gap-2.5 min-h-[36px]'
						accessibilityRole='button'
						accessibilityLabel='도착지 선택'
					>
						<View className='w-2.5 h-2.5 rounded-full bg-[#EF4444]' />
						<Text
							className='flex-1 text-[14px] font-pretendard-medium text-[#1C1917]'
							numberOfLines={1}
						>
							{destination?.name ?? '도착지를 선택하세요'}
						</Text>
					</Pressable>
				</View>

				<View className='items-center gap-2'>
					<Pressable
						onPress={onSwap}
						disabled={!origin || !destination}
						className='w-10 h-10 rounded-full bg-white items-center justify-center'
						style={[
							CARD_SHADOW,
							!origin || !destination ? { opacity: 0.4 } : undefined,
						]}
						accessibilityRole='button'
						accessibilityLabel='출발지와 도착지 바꾸기'
					>
						<Ionicons name='swap-vertical' size={18} color='#1C1917' />
					</Pressable>
					<Pressable
						onPress={() => {
							closeDropdown();
							onClose();
						}}
						className='w-10 h-10 rounded-full bg-white items-center justify-center'
						style={CARD_SHADOW}
						accessibilityRole='button'
						accessibilityLabel='길찾기 취소'
					>
						<Ionicons name='close' size={20} color='#1C1917' />
					</Pressable>
				</View>
			</View>

			{editing != null && (
				<View
					className='absolute left-0 right-12 rounded-2xl bg-white overflow-hidden'
					style={[
						CARD_SHADOW,
						{
							top: barHeight + 8,
							zIndex: 50,
							elevation: 8,
						},
					]}
				>
					<View className='flex-row items-center px-3 py-2.5 gap-2 border-b border-black/[0.06]'>
						<Ionicons name='search' size={16} color='rgba(0,0,0,0.35)' />
						<TextInput
							className='flex-1 text-black text-sm font-pretendard-regular'
							placeholder={editing === 'origin' ? '출발지 검색' : '도착지 검색'}
							placeholderTextColor='rgba(0,0,0,0.3)'
							value={query}
							onChangeText={setQuery}
							style={{ lineHeight: 0 }}
							autoFocus
						/>
						<Pressable
							onPress={closeDropdown}
							hitSlop={8}
							accessibilityLabel='검색 닫기'
						>
							<Ionicons name='close-circle' size={18} color='rgba(0,0,0,0.25)' />
						</Pressable>
					</View>

					{editing === 'origin' && hasCurrentLocation && (
						<Pressable
							onPress={() => {
								onUseCurrentLocation();
								closeDropdown();
							}}
							className='flex-row items-center gap-2 px-4 py-3 border-b border-black/[0.04]'
							accessibilityRole='button'
						>
							<Ionicons name='locate' size={18} color='#1C1917' />
							<Text className='text-[14px] font-pretendard-semibold text-[#1C1917]'>
								현재 위치
							</Text>
						</Pressable>
					)}

					{kakaoLoading && (
						<View className='flex-row items-center gap-2 px-4 py-3'>
							<ActivityIndicator size='small' color='#1C1917' />
							<Text className='text-[12px] text-black/45 font-pretendard-regular'>
								검색 중…
							</Text>
						</View>
					)}

					<ScrollView keyboardShouldPersistTaps='handled' className='max-h-60'>
						{query.trim().length === 0 && recentSuggestions.length > 0 && (
							<Text className='px-4 pt-3 pb-1 text-[11px] font-pretendard-medium text-black/35'>
								최근 검색
							</Text>
						)}
						{suggestions.map((item) => (
							<Pressable
								key={item.key}
								onPress={() => pickSuggestion(item)}
								className='px-4 py-3 border-b border-black/[0.04]'
								accessibilityRole='button'
							>
								<View className='flex-row items-center gap-2.5'>
									{query.trim().length === 0 ? (
										<Ionicons name='time-outline' size={14} color='rgba(0,0,0,0.3)' />
									) : (
										<Ionicons name='location-outline' size={14} color='rgba(0,0,0,0.3)' />
									)}
									<View className='flex-1'>
										<Text
											className='text-[14px] font-pretendard-medium text-[#1C1917]'
											numberOfLines={1}
										>
											{item.label}
										</Text>
										{item.subtitle ? (
											<Text
												className='text-[12px] font-pretendard-regular text-black/45 mt-0.5'
												numberOfLines={1}
											>
												{item.subtitle}
											</Text>
										) : null}
									</View>
								</View>
							</Pressable>
						))}
						{!kakaoLoading && kakaoError && (
							<Text className='px-4 py-4 text-[13px] text-black/40 font-pretendard-regular'>
								검색 중 오류가 발생했어요. 다시 시도해 주세요.
							</Text>
						)}
						{!kakaoLoading &&
							!kakaoError &&
							suggestions.length === 0 &&
							query.trim().length >= 1 && (
								<Text className='px-4 py-4 text-[13px] text-black/40 font-pretendard-regular'>
									검색 결과가 없어요
								</Text>
							)}
					</ScrollView>
				</View>
			)}

			{editing == null && (
				<Pressable
					onPress={() => {
						if (!canConfirm) {
							// 출발지/도착지가 없으면 해당 필드를 열어 안내
							if (!origin) openEditor('origin');
							else if (!destination) openEditor('destination');
							return;
						}
						onConfirm();
					}}
					className='h-12 rounded-2xl bg-[#1C1917] items-center justify-center mt-2'
					style={!canConfirm ? { opacity: 0.45 } : undefined}
					accessibilityRole='button'
					accessibilityLabel='경로 찾기'
				>
					<Text className='text-white text-[15px] font-pretendard-bold'>
						경로 찾기
					</Text>
				</Pressable>
			)}
		</View>
	);
}
