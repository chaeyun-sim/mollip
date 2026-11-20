import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { venueGroups, type VenueGroup } from '../data/venues';
import { hasExhibitionOn, isOpenOn } from '../utils/mapUtils';

export const FILTERS = [
	{ key: 'open', labelKey: 'map.filter_open_venue' },
	{ key: 'exhibiting', labelKey: 'map.filter_exhibiting' },
] as const;

export type FilterKey = (typeof FILTERS)[number]['key'];

const DEBOUNCE_MS = 300;

export function useMapFilter(
	extraVenues: VenueGroup[] = [],
	filterDate: Date,
	setFilterDate: (date: Date) => void,
) {
	const [inputText, setInputText] = useState('');
	const [searchText, setSearchText] = useState('');
	const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleInputChange = useCallback((text: string) => {
		setInputText(text);
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => setSearchText(text), DEBOUNCE_MS);
	}, []);

	useEffect(
		() => () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		},
		[],
	);

	const allVenues = useMemo(() => [...venueGroups, ...extraVenues], [extraVenues]);

	const mapVenues = useMemo(() => {
		if (!searchText) return allVenues;
		// 영문 이름은 대소문자 구분 없이 찾는다 (nodeul → Nodeul Island)
		const lowerQuery = searchText.toLowerCase();
		return allVenues.filter(
			(v) => v.venueName.includes(searchText) || v.venueNameEn?.toLowerCase().includes(lowerQuery),
		);
	}, [searchText, allVenues]);

	const matchesFilters = useCallback(
		(v: VenueGroup) => {
			if (activeFilters.has('open') && !isOpenOn(v.openHours, filterDate)) return false;
			if (activeFilters.has('exhibiting') && !hasExhibitionOn(v.exhibitions, filterDate))
				return false;
			return true;
		},
		[activeFilters, filterDate],
	);

	const toggleFilter = useCallback((key: FilterKey) => {
		setActiveFilters((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	return {
		searchText: inputText, // 입력창에 즉시 반영
		setSearchText: handleInputChange,
		activeFilters,
		filterDate,
		setFilterDate,
		showDatePicker,
		setShowDatePicker,
		mapVenues,
		matchesFilters,
		toggleFilter,
	};
}
