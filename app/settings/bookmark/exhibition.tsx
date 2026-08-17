import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/src/components/layout/Screen';
import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import { StatusBadge } from '@/src/components/search/StatusBadge';
import { useBookmarkedExhibitions } from '@/src/hooks/useBookmarkedExhibitions';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import {
	getExhibitionStatus,
	STATUS_LABELS,
	getDdayLabel,
} from '@/src/utils/exhibitionSearch';
import type { Exhibition } from '@/src/data/exhibitions';
import type { ExhibitionStatus } from '@/src/utils/exhibitionSearch';

type FilterOption = ExhibitionStatus | 'all';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
	{ value: 'all', label: '전체' },
	{ value: 'ongoing', label: '진행중' },
	{ value: 'upcoming', label: '예정' },
	{ value: 'ended', label: '마감' },
];

interface ExhibitionCardProps {
	ex: Exhibition;
	onPress: (id: string) => void;
}

function ExhibitionCard({ ex, onPress }: ExhibitionCardProps) {
	const status = getExhibitionStatus(ex);
	const ddayLabel = getDdayLabel(ex);
	const isBookmarked = useBookmarkStore((s) => s.isBookmarked(ex.id));
	const toggleBookmark = useBookmarkStore((s) => s.toggle);

	return (
		<Pressable
			onPress={() => onPress(ex.id)}
			accessibilityLabel={`${ex.title}, ${ex.venue}, ${STATUS_LABELS[status]}`}
			accessibilityRole='button'
			className='flex-row gap-4'
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
		>
			<View className='rounded-lg overflow-hidden w-[72px] aspect-[3/4]'>
				{ex.heroImageUri || ex.posterImage ? (
					<Image
						source={ex.heroImageUri ? { uri: ex.heroImageUri } : ex.posterImage}
						resizeMode='cover'
						className='w-full h-full'
					/>
				) : (
					<EmptyImagePlaceholder
						className='w-full h-full items-center justify-center bg-[#E5E1D8]'
						iconSize={40}
					/>
				)}
			</View>

			<View className='flex-1 justify-center gap-1.5'>
				<StatusBadge status={status} />
				<Text
					numberOfLines={2}
					className='text-[#1C1917] text-[15px] font-pretendard-semibold leading-[21px]'
				>
					{ex.title}
				</Text>
				<View className='flex-row items-center gap-1.5'>
					<Text className='text-[#A8A29E] text-[12px] font-pretendard-regular'>
						{ex.startDate} – {ex.endDate}
					</Text>
					{ddayLabel && (
						<Text className='text-[#C2410C] text-[12px] font-pretendard-semibold'>
							{ddayLabel}
						</Text>
					)}
				</View>
			</View>

			<Pressable
				onPress={() => toggleBookmark(ex.id)}
				hitSlop={8}
				accessibilityLabel={isBookmarked ? '북마크 해제' : '북마크 추가'}
				accessibilityRole='button'
				className='self-center pl-1'
			>
				<Ionicons
					name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
					size={20}
					color={isBookmarked ? '#1C1917' : '#D6D3D1'}
				/>
			</Pressable>
		</Pressable>
	);
}

export default function ExhibitionBookmarkScreen() {
	const router = useRouter();
	const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const { data, isLoading, error } = useBookmarkedExhibitions();

	const handlePress = (id: string) => {
		router.push(`/(explore)/${id}`);
	};

	const filteredData = data.filter((ex) => {
		if (activeFilter === 'all') return true;
		return getExhibitionStatus(ex) === activeFilter;
	});

	const activeLabel =
		FILTER_OPTIONS.find((o) => o.value === activeFilter)?.label ?? '전체';

	function renderList() {
		if (filteredData.length === 0) {
			return (
				<View className='flex-1 items-center justify-center gap-2'>
					<Ionicons name='bookmark-outline' size={36} color='#D6D3D1' />
					<Text className='text-[#A8A29E] text-[14px] font-pretendard-regular text-center'>
						해당하는 전시가 없어요
					</Text>
				</View>
			);
		}

		return (
			<FlatList
				data={filteredData}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<ExhibitionCard ex={item} onPress={handlePress} />
				)}
				ItemSeparatorComponent={() => (
					<View className='my-4 h-[1px] bg-[#eeeeee]' />
				)}
				contentContainerStyle={{
					paddingTop: 12,
					paddingBottom: 32,
					paddingHorizontal: 4,
				}}
				showsVerticalScrollIndicator={false}
			/>
		);
	}

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Back color='#78716C' />
				<Screen.Header.Center>
					<Text className='font-pretendard-semibold text-[16px] text-[#1C1917]'>
						관심 있는 전시
					</Text>
				</Screen.Header.Center>
			</Screen.Header>

			{isLoading ? (
				<View className='flex-1 items-center justify-center'>
					<ActivityIndicator color='#78716C' />
				</View>
			) : error ? (
				<View className='flex-1 items-center justify-center'>
					<Text className='text-[#78716C] text-[14px] font-pretendard-regular text-center'>
						전시 정보를 불러오지 못했어요
					</Text>
				</View>
			) : data.length === 0 ? (
				<View className='flex-1 items-center justify-center gap-2'>
					<Ionicons name='bookmark-outline' size={36} color='#D6D3D1' />
					<Text className='text-[#A8A29E] text-[14px] font-pretendard-regular text-center'>
						관심 있는 전시가 없어요{'\n'}전시를 탐색하고 북마크해보세요
					</Text>
				</View>
			) : (
				<View className='flex-1 '>
					<View className='flex-row items-center justify-between py-3'>
						<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
							{filteredData.length}개의 전시
						</Text>
						<Pressable
							onPress={() => setDropdownOpen(true)}
							accessibilityLabel={`시기 필터: ${activeLabel}`}
							accessibilityRole='button'
							className='flex-row items-center gap-0.5'
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<Text className='text-[#78716C] text-[13px] font-pretendard-medium'>
								{activeLabel}
							</Text>
							<Ionicons name='chevron-down' size={14} color='#78716C' />
						</Pressable>
					</View>
					{renderList()}
				</View>
			)}

			<Modal
				visible={dropdownOpen}
				transparent
				animationType='fade'
				onRequestClose={() => setDropdownOpen(false)}
			>
				<TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
					<View className='flex-1'>
						<View
							className='absolute right-4 bg-white rounded-xl overflow-hidden'
							style={{
								top: 136,
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.1,
								shadowRadius: 12,
								elevation: 8,
								minWidth: 110,
							}}
						>
							{FILTER_OPTIONS.map((option, index) => (
								<Pressable
									key={option.value}
									onPress={() => {
										setActiveFilter(option.value);
										setDropdownOpen(false);
									}}
									accessibilityLabel={option.label}
									accessibilityRole='menuitem'
									className={index > 0 ? 'border-t border-[#F5F5F4]' : ''}
									style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
								>
									<View className='flex-row items-center justify-between px-4 py-3'>
										<Text
											className={
												activeFilter === option.value
													? 'text-[#1C1917] text-[14px] font-pretendard-semibold'
													: 'text-[#78716C] text-[14px] font-pretendard-regular'
											}
										>
											{option.label}
										</Text>
										{activeFilter === option.value && (
											<Ionicons name='checkmark' size={15} color='#1C1917' />
										)}
									</View>
								</Pressable>
							))}
						</View>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</Screen>
	);
}
