import { ScrollView, View } from 'react-native';

import { Chip } from '@/src/components/common/Chip';
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
		<View className="absolute left-0 right-0" style={{ top: topOffset, zIndex: 10 }}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
			>
				<Chip
					label={
						filterDate.toDateString() === new Date().toDateString()
							? '오늘'
							: `${filterDate.getMonth() + 1}/${filterDate.getDate()}`
					}
					active={false}
					onPress={onDatePress}
					icon="calendar-outline"
					variant="elevated"
					accessibilityLabel="날짜 선택"
				/>

				{FILTERS.map((f) => (
					<Chip
						key={f.key}
						label={f.label}
						active={activeFilters.has(f.key)}
						onPress={() => toggleFilter(f.key)}
						variant="elevated"
					/>
				))}
			</ScrollView>
		</View>
	);
}
