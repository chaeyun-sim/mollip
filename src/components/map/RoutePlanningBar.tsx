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
import { searchJusoAddresses, type JusoAddressResult } from '@/src/api/juso';
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
	hasCurrentLocation: boolean;
	onSelectOrigin: (endpoint: RouteEndpoint) => void;
	onSelectDestination: (endpoint: RouteEndpoint) => void;
	onUseCurrentLocation: () => void;
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

function buildVenueSuggestions(venues: VenueGroup[], query: string): RouteSearchSuggestion[] {
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

function jusoToSuggestion(row: JusoAddressResult, index: number): RouteSearchSuggestion {
	return {
		key: `juso-${row.roadAddress}-${index}`,
		label: row.roadAddress,
		subtitle: row.jibunAddress || undefined,
		endpoint: {
			name: row.roadAddress,
			coord: { latitude: row.latitude, longitude: row.longitude },
		},
	};
}

export function RoutePlanningBar({
	origin,
	destination,
	venues,
	hasCurrentLocation,
	onSelectOrigin,
	onSelectDestination,
	onUseCurrentLocation,
	onSwap,
	onConfirm,
	onClose,
}: RoutePlanningBarProps) {
	const [editing, setEditing] = useState<EditingField>(null);
	const [query, setQuery] = useState('');
	const [barHeight, setBarHeight] = useState(0);
	const [jusoRows, setJusoRows] = useState<JusoAddressResult[]>([]);
	const [jusoLoading, setJusoLoading] = useState(false);

	useEffect(() => {
		if (editing == null) {
			setJusoRows([]);
			return;
		}
		const q = query.trim();
		if (q.length < 2) {
			setJusoRows([]);
			setJusoLoading(false);
			return;
		}
		let cancelled = false;
		setJusoLoading(true);
		const timer = setTimeout(() => {
			searchJusoAddresses(q)
				.then((rows) => {
					if (!cancelled) setJusoRows(rows);
				})
				.catch(() => {
					if (!cancelled) setJusoRows([]);
				})
				.finally(() => {
					if (!cancelled) setJusoLoading(false);
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
		() => jusoRows.map((row, i) => jusoToSuggestion(row, i)),
		[jusoRows],
	);

	const suggestions = useMemo(() => {
		const seen = new Set<string>();
		const merged: RouteSearchSuggestion[] = [];
		for (const item of [...venueSuggestions, ...addressSuggestions]) {
			if (seen.has(item.label)) continue;
			seen.add(item.label);
			merged.push(item);
			if (merged.length >= 10) break;
		}
		return merged;
	}, [venueSuggestions, addressSuggestions]);

	const canConfirm = origin != null && destination != null;

	const openEditor = (field: EditingField) => {
		setEditing(field);
		setQuery('');
		setJusoRows([]);
	};

	const pickSuggestion = (item: RouteSearchSuggestion) => {
		if (editing === 'origin') onSelectOrigin(item.endpoint);
		else if (editing === 'destination') onSelectDestination(item.endpoint);
		setEditing(null);
		setQuery('');
		setJusoRows([]);
	};

	const closeDropdown = () => {
		setEditing(null);
		setQuery('');
		setJusoRows([]);
	};

	const onBarLayout = (e: LayoutChangeEvent) => {
		setBarHeight(e.nativeEvent.layout.height);
	};

	return (
		<View>
			<View className='flex-row items-start gap-2' onLayout={onBarLayout}>
				<View className='flex-1 rounded-2xl bg-white px-3 py-2.5' style={CARD_SHADOW}>
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
						style={[CARD_SHADOW, !origin || !destination ? { opacity: 0.4 } : undefined]}
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
							autoFocus
						/>
						<Pressable onPress={closeDropdown} hitSlop={8} accessibilityLabel='검색 닫기'>
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
							<Text className='text-[14px] font-pretendard-semibold text-[#1C1917]'>현재 위치</Text>
						</Pressable>
					)}

					{jusoLoading && (
						<View className='flex-row items-center gap-2 px-4 py-3'>
							<ActivityIndicator size='small' color='#1C1917' />
							<Text className='text-[12px] text-black/45 font-pretendard-regular'>주소 검색 중…</Text>
						</View>
					)}

					<ScrollView keyboardShouldPersistTaps='handled' style={{ maxHeight: 240 }}>
						{suggestions.map((item) => (
							<Pressable
								key={item.key}
								onPress={() => pickSuggestion(item)}
								className='px-4 py-3 border-b border-black/[0.04]'
								accessibilityRole='button'
							>
								<Text className='text-[14px] font-pretendard-medium text-[#1C1917]' numberOfLines={2}>
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
							</Pressable>
						))}
						{!jusoLoading && suggestions.length === 0 && query.trim().length >= 2 && (
							<Text className='px-4 py-4 text-[13px] text-black/40 font-pretendard-regular'>
								검색 결과가 없어요
							</Text>
						)}
					</ScrollView>
				</View>
			)}

			{editing == null && (
				<Pressable
					onPress={onConfirm}
					disabled={!canConfirm}
					className='h-12 rounded-2xl bg-[#1C1917] items-center justify-center mt-2'
					style={!canConfirm ? { opacity: 0.45 } : undefined}
					accessibilityRole='button'
					accessibilityLabel='경로 찾기'
				>
					<Text className='text-white text-[15px] font-pretendard-bold'>경로 찾기</Text>
				</Pressable>
			)}
		</View>
	);
}
