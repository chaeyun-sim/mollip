import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { useBookmarkedExhibitions } from '@/src/hooks/useBookmarkedExhibitions';
import { useExhibitionSearch } from '@/src/hooks/useExhibitionSearch';
import type { Exhibition } from '@/src/data/exhibitions';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { Image } from 'react-native';
import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import { getExhibitionStatus, STATUS_LABELS, getDdayLabel } from '@/src/utils/exhibitionSearch';
import { StatusBadge } from '@/src/components/search/StatusBadge';
import { useBookmarkStore } from '@/src/store/bookmarkStore';

function ExhibitionCard({ ex, onPress }: { ex: Exhibition; onPress: (id: string) => void }) {
	const status = getExhibitionStatus(ex);
	const ddayLabel = getDdayLabel(ex);
	const isBookmarked = useBookmarkStore((s) => s.isBookmarked(ex.id));
	const toggleBookmark = useBookmarkStore((s) => s.toggle);

	return (
		<Pressable
			onPress={() => onPress(ex.id)}
			accessibilityLabel={`${ex.title}, ${ex.venue}, ${STATUS_LABELS[status]}`}
			accessibilityRole='button'
			className='flex-row gap-3.5 mb-4'
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
		>
			<View className='rounded-lg overflow-hidden w-[76px] h-[100px]'>
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

			<View className='flex-1 justify-center gap-1'>
				<StatusBadge status={status} />
				<Text numberOfLines={1} className='text-[#1C1917] text-[15px] font-pretendard-semibold'>
					{ex.title}
				</Text>
				<Text numberOfLines={1} className='text-[#78716C] text-[13px] font-pretendard-regular'>
					{ex.venue}
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
	const { data, isLoading, error } = useBookmarkedExhibitions();

	const handlePress = (id: string) => {
		router.push(`/(explore)/${id}`);
	};

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Back color='#78716C' />
				<Screen.Header.Center>
					<Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 16, color: '#1C1917' }}>
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
				<FlatList
					data={data}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => <ExhibitionCard ex={item} onPress={handlePress} />}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</Screen>
	);
}
