import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
	type LayoutChangeEvent,
} from 'react-native';
import { Divider } from '@/src/components/common/Divider';
import { TextField } from '@/src/components/common/TextField';
import { useRecentEndpoints } from '@/src/hooks/useRecentEndpoints';
import { cn } from '@/src/lib/cn';
import { searchKakaoKeyword, type KakaoLocalItem } from '@/src/api/kakao';
import type { RouteEndpoint } from '@/src/hooks/useDirections';
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
	currentLocation: RouteEndpoint | null;
	onSelectOrigin: (endpoint: RouteEndpoint) => void;
	onSelectDestination: (endpoint: RouteEndpoint) => void;
	onFocusLocation: (coord: { latitude: number; longitude: number }) => void;
	onSwap: () => void;
	onConfirm: () => void;
	onClose: () => void;
}

function buildVenueSuggestions(venues: VenueGroup[], query: string): RouteSearchSuggestion[] {
	const q = query.trim().toLowerCase();
	const list = q ? venues.filter((v) => v.venueName.toLowerCase().includes(q)) : venues.slice(0, 8);
	return list.slice(0, 6).map((v) => ({
		key: `venue-${v.venueName}`,
		label: v.venueName,
		subtitle: v.venueAddress,
		endpoint: { name: v.venueName, coord: v.coordinates },
	}));
}

function kakaoToSuggestion(item: KakaoLocalItem, index: number): RouteSearchSuggestion {
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

export const RoutePlanningBar = memo(function RoutePlanningBar({
	origin,
	destination,
	venues,
	currentLocation,
	onSelectOrigin,
	onSelectDestination,
	onFocusLocation,
	onSwap,
	onConfirm,
	onClose,
}: RoutePlanningBarProps) {
	const [editing, setEditing] = useState<EditingField>(() => (origin == null ? 'origin' : null));
	const [query, setQuery] = useState('');
	const [barHeight, setBarHeight] = useState(0);
	const [kakaoRows, setKakaoRows] = useState<KakaoLocalItem[]>([]);
	const [kakaoLoading, setKakaoLoading] = useState(false);
	const [kakaoError, setKakaoError] = useState(false);
	// 출발지·도착지는 서로 다른 "최근" 목록을 쓴다 — 검색어 입력값 자체와도, 서로와도 섞이지 않는다
	const { recents: originRecents, addRecent: addOriginRecent } =
		useRecentEndpoints('recent_route_origin_v1');
	const { recents: destinationRecents, addRecent: addDestinationRecent } = useRecentEndpoints(
		'recent_route_destination_v1',
	);
	const recents = editing === 'destination' ? destinationRecents : originRecents;

	useEffect(() => {
		const q = query.trim();
		if (editing == null || q.length < 1) return;

		let cancelled = false;
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
		return recents.map((r, i) => ({
			key: `recent-${i}`,
			label: r.name,
			subtitle: r.subtitle,
			endpoint: { name: r.name, coord: r.coord },
		}));
	}, [query, recents]);

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

	const resetKakao = () => {
		setKakaoRows([]);
		setKakaoLoading(false);
		setKakaoError(false);
	};

	const handleQueryChange = (text: string) => {
		setQuery(text);
		if (text.trim().length < 1) {
			resetKakao();
			return;
		}
		setKakaoRows([]);
		setKakaoLoading(true);
		setKakaoError(false);
	};

	const openEditor = (field: EditingField) => {
		setEditing(field);
		setQuery('');
		resetKakao();
	};

	const pickSuggestion = (item: RouteSearchSuggestion) => {
		if (editing === 'origin') {
			onSelectOrigin(item.endpoint);
			addOriginRecent(item.endpoint, item.subtitle);
		} else if (editing === 'destination') {
			onSelectDestination(item.endpoint);
			addDestinationRecent(item.endpoint, item.subtitle);
		}
		onFocusLocation(item.endpoint.coord);
		setEditing(null);
		setQuery('');
		resetKakao();
	};

	const closeDropdown = () => {
		setEditing(null);
		setQuery('');
		resetKakao();
	};

	const onBarLayout = (e: LayoutChangeEvent) => {
		setBarHeight(e.nativeEvent.layout.height);
	};

	return (
		<View>
			<View className="flex-row items-start gap-2" onLayout={onBarLayout}>
				<View
					className="flex-1 rounded-2xl bg-white px-3 py-2.5"
					style={{
						shadowColor: 'black',
						shadowOpacity: 0.12,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 2 },
						elevation: 4,
					}}
				>
					<Pressable
						onPress={() => openEditor('origin')}
						className="flex-row items-center gap-2.5 min-h-[36px]"
						accessibilityRole="button"
						accessibilityLabel="출발지 선택"
					>
						<View className="w-2.5 h-2.5 rounded-full bg-green-500" />
						<Text className="flex-1 text-sm font-pretendard-medium text-gray900" numberOfLines={1}>
							{origin?.name ?? '출발지를 선택하세요'}
						</Text>
					</Pressable>

					<Divider tone="subtle" className="my-1.5 ml-5" />

					<Pressable
						onPress={() => openEditor('destination')}
						className="flex-row items-center gap-2.5 min-h-9"
						accessibilityRole="button"
						accessibilityLabel="도착지 선택"
					>
						<View className="w-2.5 h-2.5 rounded-full bg-error" />
						<Text className="flex-1 text-sm font-pretendard-medium text-gray900" numberOfLines={1}>
							{destination?.name ?? '도착지를 선택하세요'}
						</Text>
					</Pressable>
				</View>

				<View className="items-center gap-2">
					<Pressable
						onPress={onSwap}
						disabled={!origin || !destination}
						className={cn(
							'w-10 h-10 rounded-full bg-white items-center justify-center',
							(!origin || !destination) && 'opacity-40',
						)}
						style={{
							shadowColor: 'black',
							shadowOpacity: 0.12,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 2 },
							elevation: 4,
						}}
						accessibilityRole="button"
						accessibilityLabel="출발지와 도착지 바꾸기"
					>
						<Ionicons name="swap-vertical" size={18} className="text-gray900" />
					</Pressable>
					<Pressable
						onPress={() => {
							closeDropdown();
							onClose();
						}}
						className="w-10 h-10 rounded-full bg-white items-center justify-center"
						style={{
							shadowColor: 'black',
							shadowOpacity: 0.12,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 2 },
							elevation: 4,
						}}
						accessibilityRole="button"
						accessibilityLabel="길찾기 취소"
					>
						<Ionicons name="close" size={20} className="text-gray900" />
					</Pressable>
				</View>
			</View>

			{editing != null && (
				<View
					className="absolute left-0 right-12 rounded-2xl bg-white overflow-hidden z-[50]"
					style={{
						shadowColor: 'black',
						shadowOpacity: 0.12,
						shadowRadius: 8,
						shadowOffset: { width: 0, height: 2 },
						elevation: 4,
						top: barHeight + 8,
					}}
				>
					<View className="flex-row items-center px-3 py-2.5 gap-2 border-b border-black/[0.06]">
						<Ionicons name="search" size={16} className="text-black/35" />
						<TextField
							variant="plain"
							className="text-black text-sm"
							placeholder={editing === 'origin' ? '출발지 검색' : '도착지 검색'}
							placeholderTextColor="rgba(0,0,0,0.3)"
							value={query}
							onChangeText={handleQueryChange}
							autoFocus
							returnKeyType="search"
						/>
						<Pressable onPress={closeDropdown} hitSlop={8} accessibilityLabel="검색 닫기">
							<Ionicons name="close-circle" size={18} className="text-black/25" />
						</Pressable>
					</View>

					{editing === 'origin' && currentLocation && (
						<Pressable
							onPress={() => {
								onSelectOrigin(currentLocation);
								closeDropdown();
							}}
							className="flex-row items-center gap-2 px-4 py-3 border-b border-black/4"
							accessibilityRole="button"
						>
							<Ionicons name="locate" size={18} className="text-gray900" />
							<Text className="text-sm font-pretendard-semibold text-gray900">현재 위치</Text>
						</Pressable>
					)}

					{kakaoLoading && (
						<View className="flex-row items-center gap-2 px-4 py-3">
							<ActivityIndicator size="small" className="text-gray900" />
							<Text className="text-xs text-black/45 font-pretendard-regular">검색 중…</Text>
						</View>
					)}

					<ScrollView keyboardShouldPersistTaps="handled" className="max-h-60">
						{query.trim().length === 0 && recentSuggestions.length > 0 && (
							<Text className="px-4 pt-3 pb-1 text-[11px] font-pretendard-medium text-black/35">
								최근 검색
							</Text>
						)}
						{suggestions.map((item) => (
							<Pressable
								key={item.key}
								onPress={() => pickSuggestion(item)}
								className="px-4 py-3 border-b border-black/4"
								accessibilityRole="button"
							>
								<View className="flex-row items-center gap-2.5">
									{query.trim().length === 0 ? (
										<Ionicons name="time-outline" size={14} className="text-black/30" />
									) : (
										<Ionicons name="location-outline" size={14} className="text-black/30" />
									)}
									<View className="flex-1">
										<Text className="text-sm font-pretendard-medium text-gray900" numberOfLines={1}>
											{item.label}
										</Text>
										{item.subtitle && (
											<Text
												className="text-xs font-pretendard-regular text-black/45 mt-0.5"
												numberOfLines={1}
											>
												{item.subtitle}
											</Text>
										)}
									</View>
								</View>
							</Pressable>
						))}
						{!kakaoLoading && kakaoError && (
							<Text className="px-4 py-4 text-[13px] text-black/40 font-pretendard-regular">
								검색 중 오류가 발생했어요. 다시 시도해 주세요.
							</Text>
						)}
						{!kakaoLoading &&
							!kakaoError &&
							suggestions.length === 0 &&
							query.trim().length >= 1 && (
								<Text className="px-4 py-4 text-[13px] text-black/40 font-pretendard-regular">
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
							if (!origin) openEditor('origin');
							else if (!destination) openEditor('destination');
							return;
						}
						onConfirm();
					}}
					className={cn(
						'h-12 rounded-2xl bg-secondary items-center justify-center mt-2',
						!canConfirm && 'opacity-45',
					)}
					accessibilityRole="button"
					accessibilityLabel="경로 찾기"
				>
					<Text className="text-white text-[15px] font-pretendard-bold">경로 찾기</Text>
				</Pressable>
			)}
		</View>
	);
});
