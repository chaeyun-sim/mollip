import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FILTERS, type FilterKey } from '@/src/hooks/useMapFilter';

interface FilterChipsProps {
	topOffset: number;
	filterDate: Date;
	activeFilters: Set<FilterKey>;
	toggleFilter: (key: FilterKey) => void;
	onDatePress: () => void;
}

export function FilterChips({
	topOffset,
	filterDate,
	activeFilters,
	toggleFilter,
	onDatePress,
}: FilterChipsProps) {
	return (
		<View
			className='absolute left-0 right-0'
			style={{ top: topOffset, zIndex: 10 }}
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
			>
				<Pressable
					onPress={onDatePress}
					className='flex-row items-center gap-1.5 px-3 py-2 rounded-full bg-white'
					style={{
						shadowColor: '#000',
						shadowOpacity: 0.1,
						shadowRadius: 4,
						shadowOffset: { width: 0, height: 1 },
						elevation: 2,
					}}
				>
					<Ionicons name='calendar-outline' size={13} color='rgba(0,0,0,0.5)' />
					<Text className='text-sm font-pretendard-medium text-black/70'>
						{filterDate.toDateString() === new Date().toDateString()
							? '오늘'
							: `${filterDate.getMonth() + 1}/${filterDate.getDate()}`}
					</Text>
				</Pressable>

				{FILTERS.map((f) => {
					const active = activeFilters.has(f.key);
					return (
						<Pressable
							key={f.key}
							onPress={() => toggleFilter(f.key)}
							className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full ${active ? 'bg-black' : 'bg-white'}`}
							style={{
								shadowColor: '#000',
								shadowOpacity: 0.1,
								shadowRadius: 4,
								shadowOffset: { width: 0, height: 1 },
								elevation: 2,
							}}
						>
							<Text
								className={`text-sm font-pretendard-medium ${active ? 'text-white' : 'text-black/70'}`}
							>
								{f.label}
							</Text>
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}
