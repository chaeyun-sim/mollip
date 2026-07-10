import { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import { ExhibitionCard } from '@/src/components/map/ExhibitionCard';
import { parseDate } from '@/src/utils/mapUtils';
import type { VenueGroup } from '@/src/data/venues';

interface VenueSheetProps {
	venue: VenueGroup;
	filterDate: Date;
	distanceText: string | null;
	onLayout: (height: number) => void;
	onGoToExhibition: (id: string) => void;
}

export function VenueSheet({
	venue,
	filterDate,
	distanceText,
	onLayout,
	onGoToExhibition,
}: VenueSheetProps) {
	const isToday = filterDate.toDateString() === new Date().toDateString();
	const dateLabel = isToday
		? '진행 중인 전시'
		: `${filterDate.getMonth() + 1}/${filterDate.getDate()} 진행 중`;

	const activeExhibitions = useMemo(() => {
		const d = new Date(filterDate);
		d.setHours(0, 0, 0, 0);
		return venue.exhibitions.filter((ex) => {
			const start = parseDate(ex.startDate);
			const end = parseDate(ex.endDate);
			end.setHours(23, 59, 59, 999);
			return d >= start && d <= end;
		});
	}, [venue, filterDate]);

	const upcomingExhibitions = useMemo(() => {
		const d = new Date(filterDate);
		d.setHours(0, 0, 0, 0);
		return venue.exhibitions.filter((ex) => parseDate(ex.startDate) > d);
	}, [venue, filterDate]);

	return (
		<BottomSheetScrollView
			className='px-5 pt-3'
			showsVerticalScrollIndicator={false}
		>
			{/* 헤더 영역 (snap point 계산용) */}
			<View onLayout={(e) => onLayout(e.nativeEvent.layout.height)}>
				<Image
					className='w-full h-40 rounded-lg mb-4'
					source={require('../../../assets/images/example/exhibition-1.png')}
					resizeMode='cover'
				/>
				<Pressable
					className='flex-row'
					style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
					accessibilityRole='button'
					accessibilityLabel={`${venue.venueName} 상세 보기`}
				>
					<Text className='text-black mt-2 text-[28px] font-hahmlet-bold leading-tight mb-2'>
						{venue.venueName}
					</Text>
					<Ionicons
						name='arrow-up-outline'
						size={20}
						className='rotate-45 mt-1.5 -ml-1'
					/>
				</Pressable>

				<View className='flex-row items-center gap-2 mb-5 flex-wrap'>
					<View className='flex-row items-center gap-1.5'>
						<Ionicons name='time-outline' size={13} color='rgba(0,0,0,0.3)' />
						<Text className='text-black/40 text-sm font-pretendard-regular'>
							{venue.openHours}
						</Text>
					</View>
					{venue.closedDays ? (
						<>
							<View className='w-px h-3 bg-black/10' />
							<Text className='text-black/35 text-sm font-pretendard-regular'>
								{venue.closedDays} 휴무
							</Text>
						</>
					) : null}
					{distanceText ? (
						<>
							<View className='w-px h-3 bg-black/10' />
							<Text className='text-black/35 text-sm font-pretendard-regular'>
								현재 위치에서 {distanceText}
							</Text>
						</>
					) : null}
				</View>

				<View className='h-px mt-1 mb-6 bg-black/5' />
			</View>

			{/* 진행 중인 전시 */}
			<Text className='text-black/40 text-xs font-pretendard-semibold tracking-widest uppercase mb-3'>
				{dateLabel}
			</Text>
			{activeExhibitions.length === 0 ? (
				<View className='items-center py-6 mb-6 gap-2 rounded-2xl bg-black/[0.03]'>
					<Ionicons name='image-outline' size={28} color='rgba(0,0,0,0.15)' />
					<Text className='text-black/30 text-sm font-pretendard-regular'>
						진행 중인 전시가 없어요
					</Text>
				</View>
			) : (
				<View className='gap-3 mb-8'>
					{activeExhibitions.map((ex) => (
						<ExhibitionCard key={ex.id} ex={ex} onPress={onGoToExhibition} />
					))}
				</View>
			)}

			{/* 예정 전시 */}
			{upcomingExhibitions.length > 0 && (
				<>
					<Text className='text-black/40 text-xs font-pretendard-semibold tracking-widest uppercase mb-3'>
						예정 전시
					</Text>
					<View className='gap-3 mb-10'>
						{upcomingExhibitions.map((ex) => (
							<ExhibitionCard key={ex.id} ex={ex} onPress={onGoToExhibition} />
						))}
					</View>
				</>
			)}
		</BottomSheetScrollView>
	);
}
