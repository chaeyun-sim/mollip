import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();

	return (
		<View className="absolute inset-x-0 z-[10]" style={{ top: topOffset }}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName="px-4 gap-2"
			>
				<Chip
					label={
						filterDate.toDateString() === new Date().toDateString()
							? t('common.today')
							: `${filterDate.getMonth() + 1}/${filterDate.getDate()}`
					}
					active={false}
					onPress={onDatePress}
					icon="calendar-outline"
					variant="elevated"
					accessibilityLabel={t('map.select_date_a11y')}
				/>

				{FILTERS.map((f) => (
					<Chip
						key={f.key}
						label={t(f.labelKey)}
						active={activeFilters.has(f.key)}
						onPress={() => toggleFilter(f.key)}
						variant="elevated"
					/>
				))}
			</ScrollView>
		</View>
	);
}
