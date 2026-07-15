import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXHIBITIONS, type Exhibition } from '../data/exhibitions';
import {
	getExhibitionStatus,
	isViewableOn,
	matchesExcluded,
	matchesQuery,
	type ExhibitionStatus,
} from '../utils/exhibitionSearch';
import { distanceKm } from '../utils/mapUtils';

export interface SearchResult {
	exhibition: Exhibition;
	status: ExhibitionStatus;
	/** 현재 위치 미확보 또는 좌표 없는 전시는 null */
	distanceKm: number | null;
}

const DEBOUNCE_MS = 300;

export function useExhibitionSearch() {
	const [inputText, setInputText] = useState('');
	const [searchText, setSearchText] = useState('');
	const [statusFilters, setStatusFilters] = useState<Set<ExhibitionStatus>>(new Set());
	const [filterDate, setFilterDate] = useState<Date | null>(null);
	const [excludedWords, setExcludedWords] = useState<string[]>([]);
	const [freeOnly, setFreeOnly] = useState(false);
	const [currentCoord, setCurrentCoord] = useState<{ latitude: number; longitude: number } | null>(null);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 현재 위치 1회 조회 (권한 거부 시 거리 표시 없이 동작)
	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') return;
			const loc = await Location.getCurrentPositionAsync({});
			setCurrentCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
		})();
	}, []);

	const handleInputChange = useCallback((text: string) => {
		setInputText(text);
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => setSearchText(text), DEBOUNCE_MS);
	}, []);

	useEffect(() => () => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
	}, []);

	// 디바운스 없이 즉시 반영 (최근 검색어 탭 등) — 대기 중인 디바운스도 취소
	const commitSearchText = useCallback((text: string) => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		setInputText(text);
		setSearchText(text);
	}, []);

	const toggleStatusFilter = useCallback((key: ExhibitionStatus) => {
		setStatusFilters((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	const addExcludedWord = useCallback((word: string) => {
		const trimmed = word.trim();
		if (!trimmed) return;
		setExcludedWords((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
	}, []);

	const removeExcludedWord = useCallback((word: string) => {
		setExcludedWords((prev) => prev.filter((w) => w !== word));
	}, []);

	// 필터 적용 → 거리 계산 → 거리순 정렬 (거리 없는 항목은 뒤로)
	const results = useMemo<SearchResult[]>(() => {
		return EXHIBITIONS.filter((ex) => {
			if (!matchesQuery(ex, searchText)) return false;
			if (matchesExcluded(ex, excludedWords)) return false;
			if (statusFilters.size > 0 && !statusFilters.has(getExhibitionStatus(ex))) return false;
			if (filterDate && !isViewableOn(ex, filterDate)) return false;
			if (freeOnly && !ex.admissionFree) return false;
			return true;
		})
			.map((ex) => ({
				exhibition: ex,
				status: getExhibitionStatus(ex),
				distanceKm:
					currentCoord && ex.coordinates
						? distanceKm(
								currentCoord.latitude,
								currentCoord.longitude,
								ex.coordinates.latitude,
								ex.coordinates.longitude,
							)
						: null,
			}))
			.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
	}, [searchText, excludedWords, statusFilters, filterDate, freeOnly, currentCoord]);

	return {
		searchText: inputText, // 입력창에 즉시 반영
		setSearchText: handleInputChange,
		commitSearchText,
		statusFilters,
		toggleStatusFilter,
		filterDate,
		setFilterDate,
		excludedWords,
		addExcludedWord,
		removeExcludedWord,
		freeOnly,
		toggleFreeOnly: () => setFreeOnly((prev) => !prev),
		hasLocation: currentCoord !== null,
		results,
	};
}
