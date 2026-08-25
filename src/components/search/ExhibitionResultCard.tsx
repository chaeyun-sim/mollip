import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { formatDistance } from '@/src/utils/mapUtils';
import { getDdayLabel, STATUS_LABELS } from '@/src/utils/exhibitionSearch';
import { StatusBadge } from './StatusBadge';
import type { SearchResult } from '@/src/hooks/useExhibitionSearch';

interface ExhibitionResultCardProps {
	result: SearchResult;
	onPress: (id: string) => void;
}

export function ExhibitionResultCard({
	result,
	onPress,
}: ExhibitionResultCardProps) {
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
			<ImageFallback
				heroImageUri={ex.heroImageUri}
				posterImage={ex.posterImage}
				className='rounded-lg w-[76px] h-[100px]'
				iconSize={36}
				resizeMode='cover'
			/>

			{/* 정보 */}
			<View className='flex-1 justify-center gap-1'>
				<StatusBadge status={status} />
				<Text
					numberOfLines={1}
					className='text-primary text-[15px] font-pretendard-semibold'
				>
					{ex.title}
				</Text>

				<Text
					numberOfLines={1}
					className='text-tertiary text-[13px] font-pretendard-regular'
				>
					{ex.venue}
					{distanceKm !== null && ` · ${formatDistance(distanceKm)}`}
				</Text>

				<View className='flex-row items-center gap-1.5'>
					<Text className='text-muted text-[12px] font-pretendard-regular'>
						{ex.startDate} – {ex.endDate}
					</Text>
					{ddayLabel && (
						<Text className='text-orange-700 text-[12px] font-pretendard-semibold'>
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
					className={isBookmarked ? 'text-primary' : 'text-stone-300'}
				/>
			</Pressable>
		</Pressable>
	);
}
