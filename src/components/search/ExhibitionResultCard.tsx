import { Image, Pressable, Text, View } from 'react-native';
import { formatDistance } from '@/src/utils/mapUtils';
import { STATUS_LABELS } from '@/src/utils/exhibitionSearch';
import { StatusBadge } from './StatusBadge';
import type { SearchResult } from '@/src/hooks/useExhibitionSearch';

interface ExhibitionResultCardProps {
	result: SearchResult;
	onPress: (id: string) => void;
}

export function ExhibitionResultCard({ result, onPress }: ExhibitionResultCardProps) {
	const { exhibition: ex, status, distanceKm } = result;

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
				style={{ width: 76, height: 100, backgroundColor: ex.posterColor }}
			>
				{ex.posterImage && (
					<Image source={ex.posterImage} resizeMode='cover' className='w-full h-full' />
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

				<Text
					className='text-[#A8A29E] text-[12px]'
					style={{ fontFamily: 'Pretendard-Regular' }}
				>
					{ex.startDate} – {ex.endDate}
				</Text>
			</View>
		</Pressable>
	);
}
