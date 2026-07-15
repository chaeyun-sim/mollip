import { ScrollView } from 'react-native';
import { FilterChip } from './FilterChip';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

const STATUS_KEYS: ExhibitionStatus[] = ['upcoming', 'ongoing', 'ended'];

interface SearchFilterBarProps {
	statusFilters: Set<ExhibitionStatus>;
	onToggleStatus: (key: ExhibitionStatus) => void;
	filterDate: Date | null;
	onPressDate: () => void;
	excludedCount: number;
	onPressExclude: () => void;
}

function formatChipDate(date: Date): string {
	return `${date.getMonth() + 1}.${date.getDate()}`;
}

export function SearchFilterBar({
	statusFilters,
	onToggleStatus,
	filterDate,
	onPressDate,
	excludedCount,
	onPressExclude,
}: SearchFilterBarProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ gap: 8, paddingRight: 24 }}
		>
			{STATUS_KEYS.map((key) => (
				<FilterChip
					key={key}
					label={STATUS_LABELS[key]}
					active={statusFilters.has(key)}
					onPress={() => onToggleStatus(key)}
				/>
			))}
			<FilterChip
				label={filterDate ? formatChipDate(filterDate) : '날짜'}
				active={filterDate !== null}
				onPress={onPressDate}
				icon='calendar-outline'
				accessibilityLabel='날짜 필터'
			/>
			<FilterChip
				label={excludedCount > 0 ? `제외어 ${excludedCount}` : '제외어'}
				active={excludedCount > 0}
				onPress={onPressExclude}
				icon='remove-circle-outline'
				accessibilityLabel='제외할 검색어 설정'
			/>
		</ScrollView>
	);
}
