import * as Location from 'expo-location';
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
	isExhibitionListed,
	isViewableOn,
	matchesExcluded,
	matchesQuery,
	todayExhibitionDateString,
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
const SEARCH_LIMIT = 120;

export function useExhibitionSearch() {
	const [inputText, setInputText] = useState('');
	const [searchText, setSearchText] = useState('');
	const [statusFilters, setStatusFilters] = useState<Set<ExhibitionStatus>>(new Set());
	const [filterDate, setFilterDate] = useState<Date | null>(null);
	const [excludedWords, setExcludedWords] = useState<string[]>([]);
	const [freeOnly, setFreeOnly] = useState(false);
	const [currentCoord, setCurrentCoord] = useState<{ latitude: number; longitude: number } | null>(null);
	const [remoteExhibitions, setRemoteExhibitions] = useState<Exhibition[]>([]);
	const [remoteLoading, setRemoteLoading] = useState(false);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		(async () => {
			// 온보딩에서 이미 요청했으므로 현재 상태만 확인.
			// undetermined면 한 번 요청한다(기존 사용자 fallback).
			let { status } = await Location.getForegroundPermissionsAsync();
			if (status === 'undetermined') {
				({ status } = await Location.requestForegroundPermissionsAsync());
			}
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

	const commitSearchText = useCallback((text: string) => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		setInputText(text);
		setSearchText(text);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setRemoteLoading(true);
			let query = applyExhibitionDateFilters(
				supabase
					.from('exhibitions')
					.select(`${EXHIBITION_COLUMNS}, museums ( gps_x, gps_y )`)
					.gte('end_date', todayExhibitionDateString())
					.order('start_date', { ascending: false })
					.limit(SEARCH_LIMIT),
			);
			const q = searchText.trim();
			if (q.length >= 1) {
				const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
				query = query.or(
					`title.ilike.%${escaped}%,venue_name_fallback.ilike.%${escaped}%,artist.ilike.%${escaped}%`,
				);
			}
			const { data, error } = await query;
			if (cancelled) return;
			if (error || !data) {
				setRemoteExhibitions([]);
				setRemoteLoading(false);
				return;
			}
			type Row = ExhibitionRow & {
				museums: { gps_x: string; gps_y: string } | { gps_x: string; gps_y: string }[] | null;
			};
			setRemoteExhibitions(
				(data as unknown as Row[]).map((row) => {
					const ex = mapExhibitionRowToExhibition(row);
					const museum = Array.isArray(row.museums) ? row.museums[0] : row.museums;
					const lat = Number(museum?.gps_y);
					const lon = Number(museum?.gps_x);
					if (Number.isFinite(lat) && Number.isFinite(lon)) {
						ex.coordinates = { latitude: lat, longitude: lon };
					}
					return ex;
				}),
			);
			setRemoteLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [searchText]);

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
	};
}
