import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { Chip } from '@/src/components/common/Chip';
import { type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

const STATUS_KEYS: ExhibitionStatus[] = ['upcoming', 'ongoing'];

interface SearchFilterBarProps {
	statusFilters: Set<ExhibitionStatus>;
	onToggleStatus: (key: ExhibitionStatus) => void;
	freeOnly: boolean;
	onToggleFree: () => void;
	closingSoonOnly: boolean;
	onToggleClosingSoon: () => void;
	filterDate: Date | null;
	onPressDate: () => void;
	excludedCount: number;
	onPressExclude: () => void;
}

export function SearchFilterBar({
	statusFilters,
	onToggleStatus,
	freeOnly,
	onToggleFree,
	closingSoonOnly,
	onToggleClosingSoon,
	filterDate,
	onPressDate,
	excludedCount,
	onPressExclude,
}: SearchFilterBarProps) {
	const { t } = useTranslation();

	function formatChipDate(date: Date) {
		return `${date.getMonth() + 1}.${date.getDate()}`;
	}

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerClassName="gap-2 pr-6"
		>
			{/* 마감 임박은 전부 진행 중이라 예정·진행 중 칩이 의미 없다 */}
			{!closingSoonOnly &&
				STATUS_KEYS.map((key) => (
					<Chip
						key={key}
						label={t(`exhibitions.${key}`)}
						active={statusFilters.has(key)}
						onPress={() => onToggleStatus(key)}
					/>
				))}
			<Chip
				label={t('home.closing_soon')}
				active={closingSoonOnly}
				onPress={onToggleClosingSoon}
				accessibilityLabel="2주 안에 끝나는 전시만 보기"
			/>
			<Chip label={t('common.free')} active={freeOnly} onPress={onToggleFree} />
			<Chip
				label={filterDate ? formatChipDate(filterDate) : '날짜'}
				active={filterDate !== null}
				onPress={onPressDate}
				icon="calendar-outline"
				accessibilityLabel="날짜 필터"
			/>
			<Chip
				label={excludedCount > 0 ? `제외어 ${excludedCount}` : '제외어'}
				active={excludedCount > 0}
				onPress={onPressExclude}
				icon="remove-circle-outline"
				accessibilityLabel="제외할 검색어 설정"
			/>
		</ScrollView>
	);
}
