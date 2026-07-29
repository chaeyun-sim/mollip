import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import { formatDistance } from '@/src/utils/mapUtils';
import { getDdayLabel, STATUS_LABELS } from '@/src/utils/exhibitionSearch';
import { StatusBadge } from './StatusBadge';
import type { SearchResult } from '@/src/hooks/useExhibitionSearch';

interface ExhibitionResultCardProps {
	result: SearchResult;
	onPress: (id: string) => void;
}

export function ExhibitionResultCard({ result, onPress }: ExhibitionResultCardProps) {
	const { exhibition: ex, status, distanceKm } = result;
	const ddayLabel = getDdayLabel(ex);
	const isBookmarked = useBookmarkStore((s) => s.isBookmarked(ex.id));
	const toggleBookmark = useBookmarkStore((s) => s.toggle);

	return (
		<Pressable
			onPress={() => onPress(ex.id)}
			accessibilityLabel={`${ex.title}, ${ex.venue}, ${STATUS_LABELS[status]}`}
			accessibilityRole='button'
			className='flex-row gap-3.5'
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
		>
			{/* 썸네일 + 상태 배지 오버레이 */}
			<View
				className='rounded-lg overflow-hidden'
				style={{ width: 76, height: 100 }}
			>
				{ex.heroImageUri || ex.posterImage ? (
					<Image
						source={ex.heroImageUri ? { uri: ex.heroImageUri } : ex.posterImage}
						resizeMode='cover'
						className='w-full h-full'
					/>
				) : (
					<EmptyImagePlaceholder className='w-full h-full items-center justify-center bg-[#E5E1D8]' iconSize={40} />
				)}
				<StatusBadge status={status} />
			</View>

			{/* 정보 */}
			<View className='flex-1 justify-center gap-1'>
				<Text
					numberOfLines={1}
					className='text-[#1C1917] text-[15px]'
					style={{ fontFamily: 'Pretendard-SemiBold' }}
				>
					{ex.title}
				</Text>

				<Text
					numberOfLines={1}
					className='text-[#78716C] text-[13px]'
					style={{ fontFamily: 'Pretendard-Regular' }}
				>
					{ex.venue}
					{distanceKm !== null && ` · ${formatDistance(distanceKm)}`}
				</Text>

				<View className='flex-row items-center gap-1.5'>
					<Text
						className='text-[#A8A29E] text-[12px]'
						style={{ fontFamily: 'Pretendard-Regular' }}
					>
						{ex.startDate} – {ex.endDate}
					</Text>
					{ddayLabel && (
						<Text
							className='text-[#C2410C] text-[12px]'
							style={{ fontFamily: 'Pretendard-SemiBold' }}
						>
							{ddayLabel}
						</Text>
					)}
				</View>
			</View>

			{/* 북마크 토글 */}
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
