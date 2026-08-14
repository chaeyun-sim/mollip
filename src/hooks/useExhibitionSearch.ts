import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXHIBITIONS, type Exhibition } from '../data/exhibitions';
import { supabase } from '../utils/supabase';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
} from '../utils/exhibitionMapper';
import {
	applyExhibitionDateFilters,
	getExhibitionStatus,
	getPopularTags,
	isExhibitionListed,
	isViewableOn,
	matchesExcluded,
	matchesQuery,
	todayExhibitionDateString,
	type ExhibitionStatus,
} from '../utils/exhibitionSearch';
import { distanceKm } from '../utils/mapUtils';
import { useUserLocation } from './useUserLocation';

export interface SearchResult {
	exhibition: Exhibition;
	status: ExhibitionStatus;
	/** 현재 위치 미확보 또는 좌표 없는 전시는 null */
	distanceKm: number | null;
}

const DEBOUNCE_MS = 300;
// @MX:NOTE: 전체 전시를 마운트 시 1회 fetch 후 클라이언트 사이드 필터링.
// SEARCH_LIMIT 초과 건수는 검색 결과에 포함되지 않으므로 DB 전시 총 건수가 이 값보다 크면 조정 필요.
const SEARCH_LIMIT = 120;

export function useExhibitionSearch() {
	const [inputText, setInputText] = useState('');
	const [searchText, setSearchText] = useState('');
	const [statusFilters, setStatusFilters] = useState<Set<ExhibitionStatus>>(new Set());
	const [filterDate, setFilterDate] = useState<Date | null>(null);
	const [excludedWords, setExcludedWords] = useState<string[]>([]);
	const [freeOnly, setFreeOnly] = useState(false);
	const { currentCoord } = useUserLocation();
	const [remoteExhibitions, setRemoteExhibitions] = useState<Exhibition[]>([]);
	const [remoteLoading, setRemoteLoading] = useState(false);
	const [popularTags, setPopularTags] = useState<string[]>([]);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleInputChange = useCallback((text: string) => {
		setInputText(text);
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => setSearchText(text), DEBOUNCE_MS);
	}, []);

	useEffect(() => () => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
	}, []);

	const commitSearchText = useCallback((text: string) => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		setInputText(text);
		setSearchText(text);
	}, []);

	// 마운트 시 1회 전체 목록 fetch — 텍스트 필터링은 클라이언트 사이드(matchesQuery)로 처리.
	// 서버 ilike 필터는 title/venue/artist만 커버해 tags 검색이 누락되고,
	// 결과 0개 시 remoteExhibitions = [] → catalog 붕괴 문제가 있어 제거함.
	useEffect(() => {
		let cancelled = false;
		(async () => {
			setRemoteLoading(true);
			const { data, error } = await applyExhibitionDateFilters(
				supabase
					.from('exhibitions')
					.select(`${EXHIBITION_COLUMNS}, museums ( gps_x, gps_y )`)
					.gte('end_date', todayExhibitionDateString())
					.order('start_date', { ascending: false })
					.limit(SEARCH_LIMIT),
			);
			if (cancelled) return;
			if (error || !data) {
				setRemoteLoading(false);
				return;
			}
			type Row = ExhibitionRow & {
				museums: { gps_x: string; gps_y: string } | { gps_x: string; gps_y: string }[] | null;
			};
			const mapped = (data as unknown as Row[]).map((row) => {
				const ex = mapExhibitionRowToExhibition(row);
				const museum = Array.isArray(row.museums) ? row.museums[0] : row.museums;
				const lat = Number(museum?.gps_y);
				const lon = Number(museum?.gps_x);
				if (Number.isFinite(lat) && Number.isFinite(lon)) {
					ex.coordinates = { latitude: lat, longitude: lon };
				}
				return ex;
			});
			setRemoteExhibitions(mapped);
			setPopularTags(getPopularTags(8, mapped));
			setRemoteLoading(false);
		})();
		return () => {
			cancelled = true;
		};
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

	const catalog = remoteExhibitions.length > 0 ? remoteExhibitions : EXHIBITIONS;

	const results = useMemo<SearchResult[]>(() => {
		return catalog
			.filter((ex) => {
				if (!isExhibitionListed(ex)) return false;
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
	}, [catalog, searchText, excludedWords, statusFilters, filterDate, freeOnly, currentCoord]);

	return {
		searchText: inputText,
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
		isLoading: remoteLoading,
		popularTags,
	};
}
